const Content = require('../models/Content');
const Topic = require('../models/Topic');
const contentGenerator = require('../services/ai/contentGenerator');
const redisCache = require('../services/cache/redisCache');
const config = require('../config/environment');

class ContentController {
  async generateContent(req, res) {
    try {
      const { topicId } = req.params;
      const { regenerate = false, version = null, improvements = {} } = req.body;
      
      // Validate topic exists
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      // Generate content
      const result = await contentGenerator.generateContent(topicId, {
        regenerate,
        version,
        ...improvements
      });
      
      res.json({
        success: true,
        data: {
          content: result.content,
          cached: result.cached,
          regenerated: result.regenerated,
          topicId,
          type: result.content.type
        }
      });
      
    } catch (error) {
      console.error('Generate content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate content',
        details: error.message
      });
    }
  }

  async getContent(req, res) {
    try {
      const { topicId } = req.params;
      const { step, format = 'json' } = req.query;
      
      // Get content
      let content;
      if (step !== undefined) {
        const result = await contentGenerator.getContentByStep(topicId, parseInt(step));
        content = result.content;
      } else {
        content = await Content.findByTopicAndType(topicId);
      }
      
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }
      
      await content.incrementViews();
      
      // Format response based on requested format
      if (format === 'html') {
        // For now, return JSON - HTML formatting would require templates
        return res.json({
          success: true,
          data: {
            content,
            format: 'json' // Placeholder
          }
        });
      }
      
      const responseData = {
        topicId: content.topicId,
        type: content.type,
        data: content.data,
        generation: content.generation,
        interactions: content.interactions
      };
      
      // Add step-specific information if requested
      if (step !== undefined) {
        const stepIndex = parseInt(step);
        const stepData = content.getStepByIndex(stepIndex);
        responseData.currentStep = stepIndex;
        responseData.totalSteps = content.data.steps?.length || 0;
        responseData.step = stepData;
        responseData.hasNext = content.getNextStep(stepData?.id) !== null;
        responseData.hasPrevious = content.getPreviousStep(stepData?.id) !== null;
      }
      
      res.json({
        success: true,
        data: responseData
      });
      
    } catch (error) {
      console.error('Get content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get content',
        details: error.message
      });
    }
  }

  async getStepContent(req, res) {
    try {
      const { topicId, stepIndex } = req.params;
      
      const result = await contentGenerator.getContentByStep(topicId, parseInt(stepIndex));
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Get step content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get step content',
        details: error.message
      });
    }
  }

  async regenerateContent(req, res) {
    try {
      const { topicId } = req.params;
      const { improvements = {} } = req.body;
      
      const result = await contentGenerator.regenerateContent(topicId, improvements);
      
      res.json({
        success: true,
        data: {
          content: result.content,
          regenerated: true,
          topicId,
          version: result.content.generation.version
        }
      });
      
    } catch (error) {
      console.error('Regenerate content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to regenerate content',
        details: error.message
      });
    }
  }

  async updateContent(req, res) {
    try {
      const { contentId } = req.params;
      const updates = req.body;
      
      const content = await Content.findById(contentId);
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }
      
      // Update allowed fields
      const allowedUpdates = ['status', 'data.summary', 'data.learningObjectives'];
      const actualUpdates = {};
      
      for (const key of allowedUpdates) {
        if (this.getNestedProperty(updates, key) !== undefined) {
          this.setNestedProperty(actualUpdates, key, this.getNestedProperty(updates, key));
        }
      }
      
      Object.assign(content, actualUpdates);
      await content.save();
      
      // Invalidate cache
      await redisCache.invalidatePattern(`*:${content.topicId}:*`);
      
      res.json({
        success: true,
        data: {
          contentId: content._id,
          updates: actualUpdates,
          updatedAt: content.updatedAt
        }
      });
      
    } catch (error) {
      console.error('Update content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update content',
        details: error.message
      });
    }
  }

  async deleteContent(req, res) {
    try {
      const { contentId } = req.params;
      
      const content = await Content.findById(contentId);
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }
      
      // Soft delete by marking as archived
      content.status = 'archived';
      await content.save();
      
      // Invalidate cache
      await redisCache.invalidatePattern(`*:${content.topicId}:*`);
      
      res.json({
        success: true,
        data: {
          contentId,
          status: 'archived',
          deletedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('Delete content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete content',
        details: error.message
      });
    }
  }

  async addFeedback(req, res) {
    try {
      const { contentId } = req.params;
      const { rating, comment } = req.body;
      
      const content = await Content.findById(contentId);
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }
      
      // Use user ID if authenticated, otherwise IP
      const userId = req.user?.id || req.ip;
      
      await content.addFeedback(userId, rating, comment);
      
      res.json({
        success: true,
        data: {
          contentId,
          averageRating: content.interactions.feedback.length > 0 
            ? content.interactions.feedback.reduce((sum, f) => sum + f.rating, 0) / content.interactions.feedback.length
            : null,
          totalFeedback: content.interactions.feedback.length
        }
      });
      
    } catch (error) {
      console.error('Add feedback error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add feedback',
        details: error.message
      });
    }
  }

  async getPopularContent(req, res) {
    try {
      const { limit = 10, type, timeRange = '7d' } = req.query;
      
      const content = await Content.getPopularContent(parseInt(limit), type);
      
      res.json({
        success: true,
        data: {
          content: content.map(c => ({
            contentId: c._id,
            topicId: c.topicId,
            type: c.type,
            data: {
              summary: c.data.summary,
              title: c.data.steps?.[0]?.title || c.data.labels?.[0]?.text || c.data.items?.[0]?.title
            },
            interactions: c.interactions,
            generation: c.generation
          })),
          filters: { type, timeRange }
        }
      });
      
    } catch (error) {
      console.error('Get popular content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular content',
        details: error.message
      });
    }
  }

  async getContentByType(req, res) {
    try {
      const { type } = req.params;
      const { limit = 20, sortBy = 'views' } = req.query;
      
      const query = { type, status: 'published' };
      
      // Apply sorting
      const sortOptions = {};
      switch (sortBy) {
        case 'views':
          sortOptions['interactions.viewCount'] = -1;
          break;
        case 'rating':
          sortOptions['interactions.feedback.rating'] = -1;
          break;
        case 'recent':
          sortOptions.createdAt = -1;
          break;
        default:
          sortOptions['interactions.viewCount'] = -1;
      }
      
      const content = await Content.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .select('topicId type data interactions generation createdAt');
      
      res.json({
        success: true,
        data: {
          type,
          sortBy,
          content: content.map(c => ({
            contentId: c._id,
            topicId: c.topicId,
            type: c.type,
            data: {
              summary: c.data.summary,
              title: c.data.steps?.[0]?.title || c.data.labels?.[0]?.text || c.data.items?.[0]?.title
            },
            interactions: c.interactions,
            createdAt: c.createdAt
          }))
        }
      });
      
    } catch (error) {
      console.error('Get content by type error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get content by type',
        details: error.message
      });
    }
  }

  async searchContent(req, res) {
    try {
      const { 
        query, 
        type, 
        domain, 
        complexity, 
        limit = 20, 
        offset = 0 
      } = req.query;
      
      // Build search query
      const searchQuery = { status: 'published' };
      
      if (query) {
        searchQuery['$text'] = { $search: query };
      }
      
      if (type) {
        searchQuery.type = type;
      }
      
      // For domain and complexity, we'd need to join with Topic collection
      // For now, we'll skip these filters
      
      const content = await Content.find(searchQuery)
        .sort({ 'interactions.viewCount': -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .select('topicId type data interactions generation createdAt');
      
      const total = await Content.countDocuments(searchQuery);
      
      res.json({
        success: true,
        data: {
          content: content.map(c => ({
            contentId: c._id,
            topicId: c.topicId,
            type: c.type,
            data: {
              summary: c.data.summary,
              title: c.data.steps?.[0]?.title || c.data.labels?.[0]?.text || c.data.items?.[0]?.title
            },
            interactions: c.interactions,
            createdAt: c.createdAt
          })),
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + parseInt(limit) < total
          },
          filters: { query, type, domain, complexity }
        }
      });
      
    } catch (error) {
      console.error('Search content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search content',
        details: error.message
      });
    }
  }

  async getContentStats(req, res) {
    try {
      const { contentId } = req.params;
      
      const content = await Content.findById(contentId)
        .populate('topicId', 'originalText classification');
      
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }
      
      const stats = {
        contentId: content._id,
        topicId: content.topicId._id,
        topicTitle: content.topicId.originalText,
        type: content.type,
        generation: content.generation,
        interactions: content.interactions,
        performance: {
          viewCount: content.interactions.viewCount,
          completionRate: content.interactions.completionRate,
          averageTimeSpent: content.interactions.averageTimeSpent,
          feedbackCount: content.interactions.feedback.length,
          averageRating: content.interactions.feedback.length > 0
            ? content.interactions.feedback.reduce((sum, f) => sum + f.rating, 0) / content.interactions.feedback.length
            : null
        },
        createdAt: content.createdAt,
        lastAccessed: content.lastAccessed
      };
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('Get content stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get content stats',
        details: error.message
      });
    }
  }

  // Helper methods
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

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

module.exports = new ContentController();
