const OpenAIService = require('../../config/openai');
const redisCache = require('../cache/redisCache');
const config = require('../../config/environment');
const Topic = require('../../models/Topic');

class TopicClassifier {
  constructor() {
    this.openai = OpenAIService;
    this.cache = redisCache;
  }

  async classify(topic, userId = null) {
    try {
      // Normalize topic for caching
      const normalizedTopic = this.normalizeTopic(topic);
      const cacheKey = `classify:${normalizedTopic}`;
      
      // Check cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        console.log(`Classification cache hit for: ${topic}`);
        return cached;
      }
      
      // Check if topic already exists in database
      const existingTopic = await Topic.findByText(topic);
      if (existingTopic) {
        console.log(`Found existing topic in database: ${topic}`);
        const classification = {
          topicId: existingTopic._id,
          type: existingTopic.classification.type,
          confidence: existingTopic.classification.confidence,
          reasoning: existingTopic.classification.reasoning,
          cached: true,
          fromDatabase: true
        };
        
        // Cache the result
        await this.cache.set(cacheKey, classification, config.cache.ttl.classification);
        return classification;
      }
      
      // Perform AI classification
      console.log(`Classifying new topic: ${topic}`);
      const classification = await this.performAIClassification(topic);
      
      // Cache the result
      await this.cache.set(cacheKey, classification, config.cache.ttl.classification);
      
      return classification;
      
    } catch (error) {
      console.error('Classification error:', error);
      throw new Error(`Failed to classify topic: ${error.message}`);
    }
  }

  async performAIClassification(topic) {
    const prompt = this.buildClassificationPrompt(topic);
    
    const response = await this.openai.chatCompletion([
      {
        role: 'system',
        content: 'You are an expert educational content classifier. Analyze topics and classify them into one of five categories with confidence scores. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      model: config.openai.models.classification,
      max_tokens: config.openai.maxTokens.classification,
      temperature: 0.3 // Lower temperature for more consistent classification
    });
    
    let classification;
    try {
      classification = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse classification response:', response.content);
      throw new Error('Invalid classification response format');
    }
    
    // Validate classification
    const validTypes = ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'];
    if (!validTypes.includes(classification.type)) {
      console.warn(`Invalid classification type: ${classification.type}, defaulting to structure`);
      classification.type = 'structure';
    }
    
    if (typeof classification.confidence !== 'number' || classification.confidence < 0 || classification.confidence > 1) {
      console.warn(`Invalid confidence score: ${classification.confidence}, defaulting to 0.5`);
      classification.confidence = 0.5;
    }
    
    return {
      type: classification.type,
      confidence: classification.confidence,
      reasoning: classification.reasoning || `Classified as ${classification.type} based on topic analysis`,
      model: response.model,
      cost: response.cost,
      tokensUsed: response.usage.total_tokens,
      cached: false,
      fromDatabase: false
    };
  }

  buildClassificationPrompt(topic) {
    return `Classify this educational topic into one of these categories:

1. **structure** - Static labeled diagrams (e.g., "Human heart structure", "Computer architecture")
2. **process** - Step-by-step working processes (e.g., "Photosynthesis process", "Digestive system")
3. **algorithm** - Logical execution steps with code/logic (e.g., "Binary search algorithm", "Sorting algorithms")
4. **hierarchy** - Tree-based representations (e.g., "Animal classification", "Organizational structure")
5. **comparison** - Side-by-side concept comparisons (e.g., "Python vs Java", "Mitosis vs Meiosis")

Topic to classify: "${topic}"

Return JSON format:
{
  "type": "structure|process|algorithm|hierarchy|comparison",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this topic fits the chosen category"
}

Consider the educational context and how students would typically learn about this topic.`;
  }

  normalizeTopic(topic) {
    return topic
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async batchClassify(topics, userId = null) {
    const results = [];
    
    for (const topic of topics) {
      try {
        const classification = await this.classify(topic, userId);
        results.push({ topic, classification, success: true });
      } catch (error) {
        console.error(`Failed to classify topic "${topic}":`, error);
        results.push({ topic, error: error.message, success: false });
      }
    }
    
    return results;
  }

  async getClassificationStats(timeRange = '24h') {
    const timeRangeMap = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeMs = timeRangeMap[timeRange] || timeRangeMap['24h'];
    const since = new Date(Date.now() - timeMs);
    
    const stats = await Topic.aggregate([
      {
        $match: {
          'classification.classifiedAt': { $gte: since }
        }
      },
      {
        $group: {
          _id: '$classification.type',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$classification.confidence' },
          models: { $addToSet: '$classification.model' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    return {
      timeRange,
      totalClassifications: stats.reduce((sum, stat) => sum + stat.count, 0),
      byType: stats,
      mostCommon: stats[0]?._id || null
    };
  }

  async improveClassification(topicId, correctType, feedback = null) {
    try {
      const topic = await Topic.findById(topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }
      
      // Update classification
      topic.classification.type = correctType;
      topic.classification.confidence = 1.0; // High confidence for user-confirmed classifications
      topic.classification.reasoning = feedback || 'User-confirmed classification';
      
      await topic.save();
      
      // Invalidate cache for this topic
      const normalizedTopic = this.normalizeTopic(topic.originalText);
      const cacheKey = `classify:${normalizedTopic}`;
      await this.cache.del(cacheKey);
      
      console.log(`Improved classification for topic ${topicId}: ${correctType}`);
      
      return {
        success: true,
        topicId,
        previousType: topic.classification.type,
        newType: correctType
      };
      
    } catch (error) {
      console.error('Failed to improve classification:', error);
      throw new Error(`Failed to improve classification: ${error.message}`);
    }
  }

  async validateClassification(topic, expectedType) {
    const classification = await this.classify(topic);
    
    const isCorrect = classification.type === expectedType;
    const confidence = classification.confidence;
    
    return {
      topic,
      expectedType,
      actualType: classification.type,
      isCorrect,
      confidence,
      needsReview: !isCorrect || confidence < 0.7
    };
  }
}

module.exports = new TopicClassifier();
