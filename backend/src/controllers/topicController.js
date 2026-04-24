const Topic = require('../models/Topic');
const classifier = require('../services/ai/classifier');
const contentGenerator = require('../services/ai/contentGenerator');
const redisCache = require('../services/cache/redisCache');
const config = require('../config/environment');

class TopicController {
  async createTopic(req, res) {
    try {
      const { topic, userId, metadata = {} } = req.body;
      
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Topic must be at least 3 characters long'
        });
      }
      
      // Check if topic already exists
      const existingTopic = await Topic.findByText(topic);
      if (existingTopic) {
        await existingTopic.incrementUsage();
        return res.json({
          success: true,
          data: {
            topicId: existingTopic._id,
            originalText: existingTopic.originalText,
            classification: existingTopic.classification,
            cached: true,
            usage: existingTopic.usage
          }
        });
      }
      
      // Classify the topic
      const classification = await classifier.classify(topic, userId);
      
      // Create new topic
      const newTopic = new Topic({
        originalText: topic,
        classification: {
          type: classification.type,
          confidence: classification.confidence,
          model: classification.model,
          reasoning: classification.reasoning
        },
        metadata: {
          userId,
          language: metadata.language || 'en',
          complexity: metadata.complexity || 'intermediate',
          domain: metadata.domain || 'general',
          tags: metadata.tags || []
        }
      });
      
      await newTopic.save();
      
      res.status(201).json({
        success: true,
        data: {
          topicId: newTopic._id,
          originalText: newTopic.originalText,
          classification: newTopic.classification,
          metadata: newTopic.metadata,
          usage: newTopic.usage,
          cached: false
        }
      });
      
    } catch (error) {
      console.error('Create topic error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create topic',
        details: error.message
      });
    }
  }

  async classifyTopic(req, res) {
    try {
      const { topic, userId } = req.body;
      
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Topic must be at least 3 characters long'
        });
      }
      
      const classification = await classifier.classify(topic, userId);
      
      res.json({
        success: true,
        data: {
          topic,
          classification: {
            type: classification.type,
            confidence: classification.confidence,
            reasoning: classification.reasoning
          },
          cached: classification.cached,
          fromDatabase: classification.fromDatabase,
          cost: classification.cost,
          tokensUsed: classification.tokensUsed
        }
      });
      
    } catch (error) {
      console.error('Classify topic error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to classify topic',
        details: error.message
      });
    }
  }

  async getTopic(req, res) {
    try {
      const { topicId } = req.params;
      
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      await topic.incrementUsage();
      
      res.json({
        success: true,
        data: {
          topicId: topic._id,
          originalText: topic.originalText,
          classification: topic.classification,
          metadata: topic.metadata,
          usage: topic.usage,
          similarTopics: topic.similarTopics,
          createdAt: topic.createdAt
        }
      });
      
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get topic',
        details: error.message
      });
    }
  }

  async updateTopic(req, res) {
    try {
      const { topicId } = req.params;
      const updates = req.body;
      
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      // Update allowed fields
      const allowedUpdates = ['metadata.complexity', 'metadata.domain', 'metadata.tags'];
      const actualUpdates = {};
      
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          this.setNestedProperty(actualUpdates, key, updates[key]);
        }
      }
      
      Object.assign(topic, actualUpdates);
      await topic.save();
      
      res.json({
        success: true,
        data: {
          topicId: topic._id,
          updates: actualUpdates,
          updatedAt: topic.updatedAt
        }
      });
      
    } catch (error) {
      console.error('Update topic error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update topic',
        details: error.message
      });
    }
  }

  async deleteTopic(req, res) {
    try {
      const { topicId } = req.params;
      
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      // Soft delete by marking as archived
      topic.status = 'archived';
      await topic.save();
      
      // Invalidate related cache
      await redisCache.invalidatePattern(`*:${topicId}:*`);
      
      res.json({
        success: true,
        data: {
          topicId,
          status: 'archived',
          deletedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete topic',
        details: error.message
      });
    }
  }

  async searchTopics(req, res) {
    try {
      const { 
        query, 
        type, 
        domain, 
        complexity, 
        limit = 20, 
        offset = 0,
        sortBy = 'popularity',
        sortOrder = 'desc'
      } = req.query;
      
      const searchQuery = { status: 'active' };
      
      if (query) {
        searchQuery.normalizedText = {
          $regex: query.toLowerCase().replace(/[^\w\s]/g, '').trim(),
          $options: 'i'
        };
      }
      
      if (type) {
        searchQuery['classification.type'] = type;
      }
      
      if (domain) {
        searchQuery['metadata.domain'] = domain.toLowerCase();
      }
      
      if (complexity) {
        searchQuery['metadata.complexity'] = complexity;
      }
      
      const sortOptions = {};
      const sortField = sortBy === 'popularity' ? 'usage.popularity' : 
                       sortBy === 'recent' ? 'createdAt' :
                       sortBy === 'requests' ? 'usage.requestCount' : 'usage.popularity';
      sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
      
      const topics = await Topic.find(searchQuery)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .select('-similarTopics');
      
      const total = await Topic.countDocuments(searchQuery);
      
      res.json({
        success: true,
        data: {
          topics: topics.map(topic => ({
            topicId: topic._id,
            originalText: topic.originalText,
            classification: topic.classification,
            metadata: topic.metadata,
            usage: topic.usage,
            createdAt: topic.createdAt
          })),
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + parseInt(limit) < total
          }
        }
      });
      
    } catch (error) {
      console.error('Search topics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search topics',
        details: error.message
      });
    }
  }

  async getPopularTopics(req, res) {
    try {
      const { limit = 10, domain } = req.query;
      
      const topics = await Topic.getPopularTopics(parseInt(limit), domain);
      
      res.json({
        success: true,
        data: {
          topics: topics.map(topic => ({
            topicId: topic._id,
            originalText: topic.originalText,
            classification: topic.classification,
            usage: topic.usage,
            metadata: topic.metadata
          }))
        }
      });
      
    } catch (error) {
      console.error('Get popular topics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular topics',
        details: error.message
      });
    }
  }

  async getTopicsByType(req, res) {
    try {
      const { type } = req.params;
      const { limit = 20 } = req.query;
      
      if (!['structure', 'process', 'algorithm', 'hierarchy', 'comparison'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid topic type'
        });
      }
      
      const topics = await Topic.getTopicsByType(type, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          type,
          topics: topics.map(topic => ({
            topicId: topic._id,
            originalText: topic.originalText,
            classification: topic.classification,
            usage: topic.usage
          }))
        }
      });
      
    } catch (error) {
      console.error('Get topics by type error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get topics by type',
        details: error.message
      });
    }
  }

  async rateTopic(req, res) {
    try {
      const { topicId } = req.params;
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }
      
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      await topic.addRating(rating);
      
      res.json({
        success: true,
        data: {
          topicId,
          averageRating: topic.usage.averageRating,
          ratingCount: topic.usage.ratingCount
        }
      });
      
    } catch (error) {
      console.error('Rate topic error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to rate topic',
        details: error.message
      });
    }
  }

  async improveClassification(req, res) {
    try {
      const { topicId } = req.params;
      const { correctType, feedback } = req.body;
      
      if (!['structure', 'process', 'algorithm', 'hierarchy', 'comparison'].includes(correctType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid classification type'
        });
      }
      
      const result = await classifier.improveClassification(topicId, correctType, feedback);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Improve classification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to improve classification',
        details: error.message
      });
    }
  }

  async getSimilarTopics(req, res) {
    try {
      const { topicId } = req.params;
      const { limit = 5 } = req.query;
      
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      const similarTopics = await Topic.findSimilar(topic, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          topicId,
          similarTopics: similarTopics.map(t => ({
            topicId: t._id,
            originalText: t.originalText,
            classification: t.classification,
            usage: t.usage
          }))
        }
      });
      
    } catch (error) {
      console.error('Get similar topics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get similar topics',
        details: error.message
      });
    }
  }

  // Helper method to set nested properties
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }
}

module.exports = new TopicController();
