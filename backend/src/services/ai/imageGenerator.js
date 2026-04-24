const OpenAIService = require('../../config/openai');
const Image = require('../../models/Image');
const Content = require('../../models/Content');
const redisCache = require('../cache/redisCache');
const config = require('../../config/environment');
const { v4: uuidv4 } = require('uuid');

class ImageGenerator {
  constructor() {
    this.openai = OpenAIService;
    this.cache = redisCache;
  }

  async generateImage(options) {
    try {
      const { 
        prompt, 
        size = '1024x1024', 
        quality = 'standard', 
        style = 'natural',
        topicId = null,
        contentId = null,
        type = 'main',
        stepIndex = null,
        userId = null
      } = options;

      const startTime = Date.now();
      
      // Generate image using OpenAI
      const response = await this.openai.imageGeneration(prompt, {
        size,
        quality,
        style
      });

      const generationTime = Date.now() - startTime;
      
      // Create image record
      const image = new Image({
        topicId,
        contentId,
        type,
        stepIndex,
        urls: {
          original: response.imageUrl,
          thumbnail: response.imageUrl, // Would be processed separately
          optimized: response.imageUrl // Would be processed separately
        },
        generation: {
          prompt,
          model: response.model,
          size,
          quality,
          style,
          revisedPrompt: response.revisedPrompt,
          cost: response.cost,
          generatedAt: new Date(),
          generationTime
        },
        metadata: {
          width: parseInt(size.split('x')[0]),
          height: parseInt(size.split('x')[1]),
          format: 'png',
          fileSize: 0 // Would be determined after downloading
        }
      });

      await image.save();

      // Cache the image URL
      const cacheKey = `image:${image._id}`;
      await this.cache.set(cacheKey, {
        imageId: image._id,
        imageUrl: response.imageUrl,
        prompt,
        metadata: image.metadata
      }, config.cache.ttl.images);

      console.log(`Generated image ${image._id} with cost $${response.cost}`);

      return {
        imageId: image._id,
        imageUrl: response.imageUrl,
        prompt,
        size,
        quality,
        style,
        cost: response.cost,
        generationTime,
        revisedPrompt: response.revisedPrompt
      };

    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  async generateImagesForContent(content, topicId) {
    try {
      const images = [];
      
      if (content.type === 'process' || content.type === 'algorithm') {
        // Generate images for each step
        for (let i = 0; i < content.data.steps.length; i++) {
          const step = content.data.steps[i];
          
          if (step.imagePrompt) {
            const imageResult = await this.generateImage({
              prompt: step.imagePrompt,
              topicId,
              contentId: content._id,
              type: 'step',
              stepIndex: i
            });
            
            images.push({
              stepIndex: i,
              imageId: imageResult.imageId,
              imageUrl: imageResult.imageUrl
            });
            
            // Update step with image ID
            step.imageId = imageResult.imageId;
          }
        }
      } else {
        // Generate single main image for other types
        if (content.data.imagePrompt) {
          const imageResult = await this.generateImage({
            prompt: content.data.imagePrompt,
            topicId,
            contentId: content._id,
            type: 'main'
          });
          
          images.push({
            imageId: imageResult.imageId,
            imageUrl: imageResult.imageUrl
          });
        }
      }
      
      return images;
      
    } catch (error) {
      console.error('Generate images for content error:', error);
      throw error;
    }
  }

  async detectClickableRegions(imageId, contentContext) {
    try {
      const image = await Image.findById(imageId);
      if (!image) {
        throw new Error('Image not found');
      }

      // Use GPT-4 Vision to detect clickable regions
      const prompt = `
Analyze this educational image and identify interactive regions that would be useful for learning.

Image URL: ${image.urls.original}
Content context: ${JSON.stringify(contentContext)}

Return JSON format:
{
  "regions": [
    {
      "id": "region-1",
      "type": "label|component|area|button|hotspot",
      "coordinates": {"x": 100, "y": 150, "width": 80, "height": 30},
      "content": "Educational content that appears when this region is clicked",
      "action": "show-detail|navigate|highlight|play-animation|zoom",
      "target": "optional target for navigation actions"
    }
  ]
}

Focus on educational value. Identify key components, labels, or areas that students would want to learn more about.`;

      const response = await this.openai.visionAnalysis(image.urls.original, prompt);
      
      let regionsData;
      try {
        regionsData = JSON.parse(response.content);
      } catch (parseError) {
        console.error('Failed to parse regions response:', response.content);
        throw new Error('Invalid regions response format');
      }

      // Validate and enhance regions
      if (regionsData.regions && Array.isArray(regionsData.regions)) {
        regionsData.regions = regionsData.regions.map((region, index) => {
          if (!region.id) region.id = `region-${index + 1}`;
          if (!region.type) region.type = 'area';
          if (!region.action) region.action = 'show-detail';
          
          // Validate coordinates
          if (!region.coordinates || 
              typeof region.coordinates.x !== 'number' || 
              typeof region.coordinates.y !== 'number' ||
              typeof region.coordinates.width !== 'number' ||
              typeof region.coordinates.height !== 'number') {
            // Set default coordinates if invalid
            region.coordinates = { x: 50, y: 50, width: 100, height: 50 };
          }
          
          return region;
        });

        // Save regions to image
        image.clickableRegions = regionsData.regions;
        await image.save();

        // Invalidate cache
        await this.cache.del(`regions:${imageId}`);

        console.log(`Detected ${regionsData.regions.length} clickable regions for image ${imageId}`);
      }

      return regionsData.regions || [];

    } catch (error) {
      console.error('Detect clickable regions error:', error);
      throw new Error(`Failed to detect clickable regions: ${error.message}`);
    }
  }

  async regenerateImage(imageId, newPrompt, options = {}) {
    try {
      const existingImage = await Image.findById(imageId);
      if (!existingImage) {
        throw new Error('Image not found');
      }

      // Generate new image with updated prompt
      const newImageResult = await this.generateImage({
        prompt: newPrompt,
        topicId: existingImage.topicId,
        contentId: existingImage.contentId,
        type: existingImage.type,
        stepIndex: existingImage.stepIndex,
        ...options
      });

      // Mark old image as replaced
      existingImage.processing.status = 'failed';
      existingImage.processing.errorMessage = 'Replaced with new image';
      await existingImage.save();

      return newImageResult;

    } catch (error) {
      console.error('Regenerate image error:', error);
      throw new Error(`Failed to regenerate image: ${error.message}`);
    }
  }

  async optimizeImage(imageId, options = {}) {
    try {
      const image = await Image.findById(imageId);
      if (!image) {
        throw new Error('Image not found');
      }

      const { 
        maxWidth = 1024, 
        maxHeight = 1024, 
        quality = 80,
        format = 'webp'
      } = options;

      // In a real implementation, this would use image processing library like Sharp
      // For now, we'll simulate the optimization
      
      const optimizedUrl = `${image.urls.original}?optimized=true&maxWidth=${maxWidth}&maxHeight=${maxHeight}&quality=${quality}&format=${format}`;
      
      // Update image with optimized URL
      image.urls.optimized = optimizedUrl;
      image.metadata.format = format;
      await image.save();

      return {
        imageId,
        optimizedUrl,
        originalSize: image.metadata.fileSize,
        estimatedOptimizedSize: Math.floor(image.metadata.fileSize * 0.3), // Estimate 70% reduction
        format
      };

    } catch (error) {
      console.error('Optimize image error:', error);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }

  async getImageStats(timeRange = '7d') {
    try {
      const timeRangeMap = {
        '1d': 1 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const timeMs = timeRangeMap[timeRange] || timeRangeMap['7d'];
      const since = new Date(Date.now() - timeMs);
      
      const stats = await Image.aggregate([
        {
          $match: {
            'generation.generatedAt': { $gte: since }
          }
        },
        {
          $group: {
            _id: '$generation.model',
            count: { $sum: 1 },
            totalCost: { $sum: '$generation.cost' },
            avgGenerationTime: { $avg: '$generation.generationTime' },
            avgFileSize: { $avg: '$metadata.fileSize' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      return {
        timeRange,
        byModel: stats,
        totalImages: stats.reduce((sum, stat) => sum + stat.count, 0),
        totalCost: stats.reduce((sum, stat) => sum + stat.totalCost, 0)
      };

    } catch (error) {
      console.error('Get image stats error:', error);
      throw error;
    }
  }

  async cleanupFailedGenerations() {
    try {
      const failedImages = await Image.getFailedGenerations();
      let cleanedCount = 0;

      for (const image of failedImages) {
        // Remove images that have failed more than 3 times
        if (image.processing.retryCount >= 3) {
          await Image.findByIdAndDelete(image._id);
          cleanedCount++;
          
          // Clean up cache
          await this.cache.del(`image:${image._id}`);
          await this.cache.del(`regions:${image._id}`);
        }
      }

      console.log(`Cleaned up ${cleanedCount} failed image generations`);
      return cleanedCount;

    } catch (error) {
      console.error('Cleanup failed generations error:', error);
      throw error;
    }
  }

  async validateImage(imageId) {
    try {
      const image = await Image.findById(imageId);
      if (!image) {
        return { valid: false, error: 'Image not found' };
      }

      // Check if URL is still accessible
      const axios = require('axios');
      try {
        const response = await axios.head(image.urls.original, { 
          timeout: 10000,
          validateStatus: (status) => status < 400
        });
        
        return {
          valid: true,
          accessible: true,
          status: response.status,
          contentType: response.headers['content-type']
        };
      } catch (urlError) {
        return {
          valid: false,
          accessible: false,
          error: 'Image URL not accessible'
        };
      }

    } catch (error) {
      console.error('Validate image error:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new ImageGenerator();
