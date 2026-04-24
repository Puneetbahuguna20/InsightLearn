const OpenAI = require('openai');
const config = require('./environment');

class OpenAIService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
  }

  initialize() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: 30000, // 30 seconds timeout
      maxRetries: 3,
    });

    this.isConfigured = true;
    console.log('OpenAI client initialized');
  }

  getClient() {
    if (!this.isConfigured) {
      this.initialize();
    }
    return this.client;
  }

  async chatCompletion(messages, options = {}) {
    try {
      const client = this.getClient();
      
      const defaultOptions = {
        model: config.openai.models.content,
        max_tokens: config.openai.maxTokens.content,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      };

      const requestOptions = { ...defaultOptions, ...options };

      const response = await client.chat.completions.create({
        messages,
        ...requestOptions
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        cost: this.calculateCost(response.usage, response.model)
      };
    } catch (error) {
      console.error('OpenAI chat completion error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async imageGeneration(prompt, options = {}) {
    try {
      const client = this.getClient();
      
      const defaultOptions = {
        model: config.openai.models.image,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
        response_format: 'url'
      };

      const requestOptions = { ...defaultOptions, ...options };

      const response = await client.images.generate({
        prompt,
        ...requestOptions
      });

      return {
        imageUrl: response.data[0].url,
        revisedPrompt: response.data[0].revised_prompt,
        model: requestOptions.model,
        cost: config.costs.dallE3
      };
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      throw new Error(`OpenAI image generation error: ${error.message}`);
    }
  }

  async visionAnalysis(imageUrl, prompt, options = {}) {
    try {
      const client = this.getClient();
      
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ];

      const defaultOptions = {
        model: config.openai.models.vision,
        max_tokens: config.openai.maxTokens.vision,
        temperature: 0.5
      };

      const requestOptions = { ...defaultOptions, ...options };

      const response = await client.chat.completions.create({
        messages,
        ...requestOptions
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        cost: this.calculateCost(response.usage, response.model)
      };
    } catch (error) {
      console.error('OpenAI vision analysis error:', error);
      throw new Error(`OpenAI vision analysis error: ${error.message}`);
    }
  }

  calculateCost(usage, model) {
    if (!usage) return 0;

    const pricing = {
      'gpt-3.5-turbo': config.costs.gpt35,
      'gpt-4': config.costs.gpt4,
      'gpt-4-vision-preview': config.costs.gpt4Vision
    };

    const pricePer1K = pricing[model] || config.costs.gpt4;
    const totalTokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
    
    return (totalTokens / 1000) * pricePer1K;
  }

  async healthCheck() {
    try {
      const response = await this.chatCompletion([
        { role: 'user', content: 'Respond with "OK"' }
      ], {
        model: config.openai.models.classification,
        max_tokens: 10
      });

      return {
        status: 'healthy',
        model: response.model,
        cost: response.cost
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Prompt templates
  getPromptTemplates() {
    return {
      classification: `Classify this topic into one of these categories: structure, process, algorithm, hierarchy, comparison.

Topic: "{{TOPIC}}"

Return JSON format:
{
  "type": "structure|process|algorithm|hierarchy|comparison",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`,

      process: `Generate step-by-step process for "{{TOPIC}}".

Return JSON format:
{
  "steps": [
    {
      "id": "step-1",
      "title": "Step Title",
      "description": "Detailed description of what happens in this step",
      "imagePrompt": "Clear, educational DALL-E prompt for visualizing this step",
      "keyPoints": ["Important point 1", "Important point 2"]
    }
  ]
}`,

      structure: `Generate labeled diagram structure for "{{TOPIC}}".

Return JSON format:
{
  "labels": [
    {
      "id": "label-1",
      "text": "Label Text",
      "position": {"x": 100, "y": 200},
      "connections": ["label-2"],
      "description": "Brief description of this component"
    }
  ],
  "imagePrompt": "Educational diagram showing the complete structure with clear labels"
}`,

      algorithm: `Generate algorithm steps for "{{TOPIC}}".

Return JSON format:
{
  "steps": [
    {
      "id": "step-1",
      "title": "Step Title",
      "description": "Detailed explanation of this algorithm step",
      "imagePrompt": "Educational visualization of this algorithm step",
      "code": "Optional code snippet",
      "complexity": "O(n) or similar"
    }
  ]
}`,

      hierarchy: `Generate hierarchical structure for "{{TOPIC}}".

Return JSON format:
{
  "nodes": [
    {
      "id": "node-1",
      "label": "Node Label",
      "level": 0,
      "parentId": null,
      "children": ["node-2"],
      "description": "Brief description"
    }
  ],
  "imagePrompt": "Hierarchical tree diagram showing the complete structure"
}`,

      comparison: `Generate comparison for "{{TOPIC}}".

Return JSON format:
{
  "items": [
    {
      "id": "item-1",
      "title": "Item Title",
      "properties": {
        "feature1": "value1",
        "feature2": "value2"
      },
      "description": "Detailed description"
    }
  ],
  "comparisonCriteria": ["criteria1", "criteria2"],
  "imagePrompt": "Side-by-side comparison visualization"
}`
    };
  }
}

module.exports = new OpenAIService();
