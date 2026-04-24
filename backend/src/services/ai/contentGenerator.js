const OpenAIService = require('../../config/openai');
const redisCache = require('../cache/redisCache');
const config = require('../../config/environment');
const Topic = require('../../models/Topic');
const Content = require('../../models/Content');

class ContentGenerator {
  constructor() {
    this.openai = OpenAIService;
    this.cache = redisCache;
    this.promptTemplates = this.openai.getPromptTemplates();
  }

  async generateContent(topicId, options = {}) {
    try {
      const { regenerate = false, version = null } = options;
      
      // Get topic information
      const topic = await Topic.findById(topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }
      
      // Check if content already exists (unless regenerating)
      if (!regenerate) {
        const existingContent = await Content.findByTopicAndType(topicId, topic.classification.type);
        if (existingContent) {
          console.log(`Found existing content for topic ${topicId}`);
          await existingContent.incrementViews();
          return {
            content: existingContent,
            cached: true,
            regenerated: false
          };
        }
      }
      
      // Check cache
      const cacheKey = `content:${topicId}:${topic.classification.type}:${version || 'latest'}`;
      const cached = await this.cache.get(cacheKey);
      if (cached && !regenerate) {
        console.log(`Content cache hit for topic ${topicId}`);
        return {
          content: cached,
          cached: true,
          regenerated: false
        };
      }
      
      // Generate new content
      console.log(`Generating content for topic ${topicId} of type ${topic.classification.type}`);
      const generatedContent = await this.performContentGeneration(topic, version);
      
      // Save to database
      const content = new Content({
        topicId: topic._id,
        type: topic.classification.type,
        data: generatedContent.data,
        generation: {
          model: generatedContent.model,
          prompt: generatedContent.prompt,
          tokensUsed: generatedContent.tokensUsed,
          cost: generatedContent.cost,
          version: version || 1
        }
      });
      
      await content.save();
      
      // Cache the result
      await this.cache.set(cacheKey, content, config.cache.ttl.content);
      
      console.log(`Successfully generated content for topic ${topicId}`);
      
      return {
        content,
        cached: false,
        regenerated: regenerate
      };
      
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async performContentGeneration(topic, version = null) {
    const template = this.promptTemplates[topic.classification.type];
    if (!template) {
      throw new Error(`No template found for content type: ${topic.classification.type}`);
    }
    
    const prompt = template
      .replace(/{{TOPIC}}/g, topic.originalText)
      .replace(/{{COMPLEXITY}}/g, topic.metadata.complexity || 'intermediate')
      .replace(/{{DOMAIN}}/g, topic.metadata.domain || 'general');
    
    const response = await this.openai.chatCompletion([
      {
        role: 'system',
        content: `You are an expert educational content creator. Generate comprehensive, accurate, and engaging educational content for ${topic.classification.type} topics. Always respond with valid JSON.`
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      model: config.openai.models.content,
      max_tokens: config.openai.maxTokens.content,
      temperature: 0.7
    });
    
    let contentData;
    try {
      contentData = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse content response:', response.content);
      throw new Error('Invalid content response format');
    }
    
    // Validate and enhance content based on type
    contentData = await this.validateAndEnhanceContent(contentData, topic.classification.type);
    
    return {
      data: contentData,
      model: response.model,
      prompt,
      tokensUsed: response.usage.total_tokens,
      cost: response.cost
    };
  }

  async validateAndEnhanceContent(contentData, type) {
    switch (type) {
      case 'process':
      case 'algorithm':
        return this.validateProcessContent(contentData);
      case 'structure':
        return this.validateStructureContent(contentData);
      case 'hierarchy':
        return this.validateHierarchyContent(contentData);
      case 'comparison':
        return this.validateComparisonContent(contentData);
      default:
        return contentData;
    }
  }

  validateProcessContent(contentData) {
    if (!contentData.steps || !Array.isArray(contentData.steps)) {
      throw new Error('Process content must have steps array');
    }
    
    if (contentData.steps.length === 0) {
      throw new Error('Process content must have at least one step');
    }
    
    // Validate each step
    contentData.steps = contentData.steps.map((step, index) => {
      if (!step.id) step.id = `step-${index + 1}`;
      if (!step.title) step.title = `Step ${index + 1}`;
      if (!step.description) step.description = 'No description provided';
      if (!step.order && step.order !== 0) step.order = index;
      
      // Generate image prompt if not provided
      if (!step.imagePrompt) {
        step.imagePrompt = `Educational diagram showing: ${step.title} - ${step.description.substring(0, 100)}`;
      }
      
      return step;
    });
    
    // Sort steps by order
    contentData.steps.sort((a, b) => a.order - b.order);
    
    return contentData;
  }

  validateStructureContent(contentData) {
    if (!contentData.labels || !Array.isArray(contentData.labels)) {
      throw new Error('Structure content must have labels array');
    }
    
    if (contentData.labels.length === 0) {
      throw new Error('Structure content must have at least one label');
    }
    
    // Validate each label
    contentData.labels = contentData.labels.map((label, index) => {
      if (!label.id) label.id = `label-${index + 1}`;
      if (!label.text) label.text = `Label ${index + 1}`;
      if (!label.position) label.position = { x: 100 + (index * 50), y: 100 + (index * 50) };
      if (!label.connections) label.connections = [];
      
      return label;
    });
    
    // Generate image prompt if not provided
    if (!contentData.imagePrompt) {
      const labelTexts = contentData.labels.map(l => l.text).join(', ');
      contentData.imagePrompt = `Educational labeled diagram showing: ${labelTexts}`;
    }
    
    return contentData;
  }

  validateHierarchyContent(contentData) {
    if (!contentData.nodes || !Array.isArray(contentData.nodes)) {
      throw new Error('Hierarchy content must have nodes array');
    }
    
    if (contentData.nodes.length === 0) {
      throw new Error('Hierarchy content must have at least one node');
    }
    
    // Validate each node and build hierarchy
    const nodeMap = {};
    contentData.nodes = contentData.nodes.map((node, index) => {
      if (!node.id) node.id = `node-${index + 1}`;
      if (!node.label) node.label = `Node ${index + 1}`;
      if (!node.level && node.level !== 0) node.level = 0;
      if (!node.children) node.children = [];
      
      nodeMap[node.id] = node;
      return node;
    });
    
    // Build parent-child relationships
    contentData.nodes.forEach(node => {
      if (node.parentId && nodeMap[node.parentId]) {
        if (!nodeMap[node.parentId].children.includes(node.id)) {
          nodeMap[node.parentId].children.push(node.id);
        }
      }
    });
    
    // Identify root nodes
    contentData.rootNodes = contentData.nodes
      .filter(node => !node.parentId)
      .map(node => node.id);
    
    // Generate image prompt if not provided
    if (!contentData.imagePrompt) {
      const nodeLabels = contentData.nodes.map(n => n.label).join(', ');
      contentData.imagePrompt = `Educational hierarchical tree diagram showing: ${nodeLabels}`;
    }
    
    return contentData;
  }

  validateComparisonContent(contentData) {
    if (!contentData.items || !Array.isArray(contentData.items)) {
      throw new Error('Comparison content must have items array');
    }
    
    if (contentData.items.length < 2) {
      throw new Error('Comparison content must have at least two items');
    }
    
    // Validate each item
    contentData.items = contentData.items.map((item, index) => {
      if (!item.id) item.id = `item-${index + 1}`;
      if (!item.title) item.title = `Item ${index + 1}`;
      if (!item.properties) item.properties = {};
      
      return item;
    });
    
    // Extract comparison criteria if not provided
    if (!contentData.comparisonCriteria) {
      const allProperties = new Set();
      contentData.items.forEach(item => {
        Object.keys(item.properties).forEach(prop => allProperties.add(prop));
      });
      contentData.comparisonCriteria = Array.from(allProperties);
    }
    
    // Generate image prompt if not provided
    if (!contentData.imagePrompt) {
      const itemTitles = contentData.items.map(i => i.title).join(' vs ');
      contentData.imagePrompt = `Educational side-by-side comparison of: ${itemTitles}`;
    }
    
    return contentData;
  }

  async regenerateContent(topicId, improvements = {}) {
    const topic = await Topic.findById(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }
    
    // Get existing content to determine next version
    const existingContent = await Content.findByTopicAndType(topicId, topic.classification.type);
    const nextVersion = existingContent ? existingContent.generation.version + 1 : 1;
    
    // Apply improvements to generation options
    const options = {
      regenerate: true,
      version: nextVersion,
      ...improvements
    };
    
    return await this.generateContent(topicId, options);
  }

  async getContentByStep(topicId, stepIndex) {
    const content = await Content.findByTopicAndType(topicId);
    if (!content || !content.data.steps) {
      throw new Error('Content not found or not step-based');
    }
    
    const step = content.getStepByIndex(stepIndex);
    if (!step) {
      throw new Error(`Step ${stepIndex} not found`);
    }
    
    await content.incrementViews();
    
    return {
      content,
      step,
      totalSteps: content.data.steps.length,
      currentIndex: stepIndex,
      hasNext: content.getNextStep(step.id) !== null,
      hasPrevious: content.getPreviousStep(step.id) !== null
    };
  }

  async getContentStats(timeRange = '7d') {
    const timeRangeMap = {
      '1d': 1 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeMs = timeRangeMap[timeRange] || timeRangeMap['7d'];
    const since = new Date(Date.now() - timeMs);
    
    const stats = await Content.aggregate([
      {
        $match: {
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgTokensUsed: { $avg: '$generation.tokensUsed' },
          totalCost: { $sum: '$generation.cost' },
          avgViews: { $avg: '$interactions.viewCount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    return {
      timeRange,
      totalContent: stats.reduce((sum, stat) => sum + stat.count, 0),
      totalCost: stats.reduce((sum, stat) => sum + stat.totalCost, 0),
      byType: stats
    };
  }
}

module.exports = new ContentGenerator();
