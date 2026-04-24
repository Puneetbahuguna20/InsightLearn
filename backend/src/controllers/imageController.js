const Image = require('../models/Image');
const Content = require('../models/Content');
const Topic = require('../models/Topic');
const redisCache = require('../services/cache/redisCache');
const config = require('../config/environment');

class ImageController {
  async generateImage(req, res) {
    try {
      const { prompt, size = '1024x1024', quality = 'standard', style = 'natural' } = req.body;
      
      // Import OpenAI service dynamically to avoid circular dependencies
      const openaiService = require('../services/ai/imageGenerator');
      
      // Generate image
      const result = await openaiService.generateImage({
        prompt,
        size,
        quality,
        style,
        userId: req.user?.id || null
      });
      
      res.json({
        success: true,
        data: {
          imageId: result.imageId,
          imageUrl: result.imageUrl,
          prompt: result.prompt,
          size,
          quality,
          style,
          cost: result.cost,
          generationTime: result.generationTime
        }
      });
      
    } catch (error) {
      console.error('Generate image error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate image',
        details: error.message
      });
    }
  }

  async getImage(req, res) {
    try {
      const { imageId } = req.params;
      
      const image = await Image.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }
      
      await image.incrementViews();
      
      res.json({
        success: true,
        data: {
          imageId: image._id,
          topicId: image.topicId,
          contentId: image.contentId,
          type: image.type,
          stepIndex: image.stepIndex,
          urls: image.urls,
          metadata: image.metadata,
          generation: image.generation,
          clickableRegions: image.clickableRegions,
          analytics: image.analytics
        }
      });
      
    } catch (error) {
      console.error('Get image error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get image',
        details: error.message
      });
    }
  }

  async getImageRegions(req, res) {
    try {
      const { imageId } = req.params;
      
      // Check cache first
      const cacheKey = `regions:${imageId}`;
      const cached = await redisCache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true
        });
      }
      
      const image = await Image.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }
      
      const regionsData = {
        imageId: image._id,
        regions: image.clickableRegions || [],
        metadata: {
          totalRegions: image.clickableRegions?.length || 0,
          lastUpdated: image.updatedAt
        }
      };
      
      // Cache for 1 hour
      await redisCache.set(cacheKey, regionsData, 3600);
      
      res.json({
        success: true,
        data: regionsData,
        cached: false
      });
      
    } catch (error) {
      console.error('Get image regions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get image regions',
        details: error.message
      });
    }
  }

  async addImageRegion(req, res) {
    try {
      const { imageId } = req.params;
      const regionData = req.body;
      
      const image = await Image.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }
      
      await image.addClickableRegion(regionData);
      
      // Invalidate cache
      await redisCache.del(`regions:${imageId}`);
      
      res.json({
        success: true,
        data: {
          imageId,
          regionId: regionData.id,
          totalRegions: image.clickableRegions.length
        }
      });
      
    } catch (error) {
      console.error('Add image region error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add image region',
        details: error.message
      });
    }
  }

  async updateImageRegion(req, res) {
    try {
      const { imageId, regionId } = req.params;
      const updates = req.body;
      
      const image = await Image.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }
      
      const regionIndex = image.clickableRegions.findIndex(r => r.id === regionId);
      if (regionIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Region not found'
        });
      }
      
      // Update region
      Object.assign(image.clickableRegions[regionIndex], updates);
      await image.save();
      
      // Invalidate cache
      await redisCache.del(`regions:${imageId}`);
      
      res.json({
        success: true,
        data: {
          imageId,
          regionId,
          region: image.clickableRegions[regionIndex]
        }
      });
      
    } catch (error) {
      console.error('Update image region error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update image region',
        details: error.message
      });
    }
  }

  async removeImageRegion(req, res) {
    try {
      const { imageId, regionId } = req.params;
      
      const image = await Image.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }
      
      await image.removeClickableRegion(regionId);
      
      // Invalidate cache
      await redisCache.del(`regions:${imageId}`);
      
      res.json({
        success: true,
        data: {
          imageId,
          regionId,
          totalRegions: image.clickableRegions.length
        }
      });
      
    } catch (error) {
      console.error('Remove image region error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove image region',
        details: error.message
      });
    }
  }

  async trackRegionClick(req, res) {
    try {
      const { imageId } = req.params;
      const { regionId, coordinates, timestamp } = req.body;
      
      const image = await Image.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }
      
      await image.incrementRegionClick(regionId);
      
      res.json({
        success: true,
        data: {
          imageId,
          regionId,
          totalClicks: image.analytics.clickCount,
          regionClicks: image.analytics.regionClicks.find(rc => rc.regionId === regionId)?.count || 0
        }
      });
      
    } catch (error) {
      console.error('Track region click error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track region click',
        details: error.message
      });
    }
  }

  async getTopicImages(req, res) {
    try {
      const { topicId } = req.params;
      const { type, limit = 20 } = req.query;
      
      const images = await Image.findByTopic(topicId, type);
      const limitedImages = images.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          topicId,
          type,
          images: limitedImages.map(img => ({
            imageId: img._id,
            type: img.type,
            stepIndex: img.stepIndex,
            urls: img.urls,
            metadata: img.metadata,
            generation: img.generation,
            analytics: img.analytics
          })),
          total: images.length,
          returned: limitedImages.length
        }
      });
      
    } catch (error) {
      console.error('Get topic images error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get topic images',
        details: error.message
      });
    }
  }

  async getContentImages(req, res) {
    try {
      const { contentId } = req.params;
      const { stepIndex } = req.query;
      
      const images = await Image.findByContent(contentId, stepIndex ? parseInt(stepIndex) : null);
      
      res.json({
        success: true,
        data: {
          contentId,
          stepIndex,
          images: images.map(img => ({
            imageId: img._id,
            type: img.type,
            stepIndex: img.stepIndex,
            urls: img.urls,
            metadata: img.metadata,
            generation: img.generation,
            clickableRegions: img.clickableRegions
          })),
          total: images.length
        }
      });
      
    } catch (error) {
      console.error('Get content images error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get content images',
        details: error.message
      });
    }
  }

  async getPopularImages(req, res) {
    try {
      const { limit = 10, type } = req.query;
      
      const images = await Image.getPopularImages(parseInt(limit));
      
      // Filter by type if specified
      const filteredImages = type 
        ? images.filter(img => img.type === type)
        : images;
      
      res.json({
        success: true,
        data: {
          images: filteredImages.map(img => ({
            imageId: img._id,
            topicId: img.topicId,
            type: img.type,
            urls: img.urls,
            metadata: img.metadata,
            analytics: img.analytics,
            generation: img.generation
          })),
          filters: { type },
          total: filteredImages.length
        }
      });
      
    } catch (error) {
      console.error('Get popular images error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular images',
        details: error.message
      });
    }
  }

  async deleteImage(req, res) {
    try {
      const { imageId } = req.params;
      
      const image = await Image.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }
      
      // Soft delete by marking processing status as failed
      await image.updateProcessingStatus('failed', 'Deleted by user');
      
      // Invalidate cache
      await redisCache.del(`regions:${imageId}`);
      
      res.json({
        success: true,
        data: {
          imageId,
          status: 'deleted',
          deletedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete image',
        details: error.message
      });
    }
  }

  async getImageStats(req, res) {
    try {
      const { timeRange = '7d', model } = req.query;
      
      const timeRangeMap = {
        '1d': 1 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const timeMs = timeRangeMap[timeRange] || timeRangeMap['7d'];
      const since = new Date(Date.now() - timeMs);
      
      // Build query
      const query = { 'generation.generatedAt': { $gte: since } };
      if (model) {
        query['generation.model'] = model;
      }
      
      const stats = await Image.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              type: '$type',
              model: '$generation.model'
            },
            count: { $sum: 1 },
            totalCost: { $sum: '$generation.cost' },
            avgGenerationTime: { $avg: '$generation.generationTime' },
            totalViews: { $sum: '$analytics.viewCount' },
            totalClicks: { $sum: '$analytics.clickCount' }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            models: {
              $push: {
                model: '$_id.model',
                count: '$count',
                totalCost: '$totalCost',
                avgGenerationTime: '$avgGenerationTime'
              }
            },
            totalCount: { $sum: '$count' },
            totalCost: { $sum: '$totalCost' },
            totalViews: { $sum: '$totalViews' },
            totalClicks: { $sum: '$totalClicks' }
          }
        },
        { $sort: { totalCount: -1 } }
      ]);
      
      const overall = await Image.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalImages: { $sum: 1 },
            totalCost: { $sum: '$generation.cost' },
            avgGenerationTime: { $avg: '$generation.generationTime' },
            totalViews: { $sum: '$analytics.viewCount' },
            totalClicks: { $sum: '$analytics.clickCount' },
            avgFileSize: { $avg: '$metadata.fileSize' }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          timeRange,
          byType: stats,
          overall: overall[0] || {},
          filters: { model }
        }
      });
      
    } catch (error) {
      console.error('Get image stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get image stats',
        details: error.message
      });
    }
  }
}

module.exports = new ImageController();
