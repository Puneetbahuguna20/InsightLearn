const express = require('express');
const imageController = require('../controllers/imageController');
const rateLimiter = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply stricter rate limiting to image routes
router.use(rateLimiter.createImageLimiter());

// Validation schemas
const generateImageSchema = {
  prompt: { type: 'string', minLength: 10, maxLength: 2000, required: true },
  size: { type: 'string', enum: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'], optional: true },
  quality: { type: 'string', enum: ['standard', 'hd'], optional: true },
  style: { type: 'string', enum: ['vivid', 'natural'], optional: true }
};

const addRegionSchema = {
  id: { type: 'string', required: true },
  type: { type: 'string', enum: ['label', 'component', 'area', 'button', 'hotspot'], required: true },
  coordinates: {
    type: 'object',
    required: true,
    properties: {
      x: { type: 'number', min: 0, required: true },
      y: { type: 'number', min: 0, required: true },
      width: { type: 'number', min: 1, required: true },
      height: { type: 'number', min: 1, required: true }
    }
  },
  content: { type: 'string', maxLength: 500, required: true },
  action: { type: 'string', enum: ['show-detail', 'navigate', 'highlight', 'play-animation', 'zoom'], optional: true },
  target: { type: 'string', optional: true }
};

/**
 * POST /api/images/generate
 * Generate a new image
 */
router.post('/generate',
  auth.optional, // Optional authentication
  validation.validate(generateImageSchema),
  imageController.generateImage
);

/**
 * GET /api/images/:imageId
 * Get image details
 */
router.get('/:imageId',
  validation.validateParams({
    imageId: { type: 'string', required: true }
  }),
  imageController.getImage
);

/**
 * GET /api/images/:imageId/regions
 * Get clickable regions for an image
 */
router.get('/:imageId/regions',
  validation.validateParams({
    imageId: { type: 'string', required: true }
  }),
  imageController.getImageRegions
);

/**
 * POST /api/images/:imageId/regions
 * Add clickable region to an image
 */
router.post('/:imageId/regions',
  auth.required, // Requires authentication
  validation.validateParams({
    imageId: { type: 'string', required: true }
  }),
  validation.validate(addRegionSchema),
  imageController.addImageRegion
);

/**
 * PUT /api/images/:imageId/regions/:regionId
 * Update clickable region
 */
router.put('/:imageId/regions/:regionId',
  auth.required, // Requires authentication
  validation.validateParams({
    imageId: { type: 'string', required: true },
    regionId: { type: 'string', required: true }
  }),
  validation.validate({
    type: { type: 'string', enum: ['label', 'component', 'area', 'button', 'hotspot'], optional: true },
    coordinates: { type: 'object', optional: true },
    content: { type: 'string', maxLength: 500, optional: true },
    action: { type: 'string', enum: ['show-detail', 'navigate', 'highlight', 'play-animation', 'zoom'], optional: true },
    target: { type: 'string', optional: true }
  }),
  imageController.updateImageRegion
);

/**
 * DELETE /api/images/:imageId/regions/:regionId
 * Remove clickable region
 */
router.delete('/:imageId/regions/:regionId',
  auth.required, // Requires authentication
  validation.validateParams({
    imageId: { type: 'string', required: true },
    regionId: { type: 'string', required: true }
  }),
  imageController.removeImageRegion
);

/**
 * POST /api/images/:imageId/click
 * Track region click
 */
router.post('/:imageId/click',
  validation.validateParams({
    imageId: { type: 'string', required: true }
  }),
  validation.validate({
    regionId: { type: 'string', required: true },
    coordinates: { type: 'object', optional: true },
    timestamp: { type: 'number', optional: true }
  }),
  imageController.trackRegionClick
);

/**
 * GET /api/images/topic/:topicId
 * Get images for a topic
 */
router.get('/topic/:topicId',
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  validation.validateQuery({
    type: { type: 'string', enum: ['main', 'step', 'detail', 'comparison'], optional: true },
    limit: { type: 'number', min: 1, max: 50, optional: true }
  }),
  imageController.getTopicImages
);

/**
 * GET /api/images/content/:contentId
 * Get images for content
 */
router.get('/content/:contentId',
  validation.validateParams({
    contentId: { type: 'string', required: true }
  }),
  validation.validateQuery({
    stepIndex: { type: 'number', min: 0, optional: true }
  }),
  imageController.getContentImages
);

/**
 * GET /api/images/popular
 * Get popular images
 */
router.get('/popular',
  validation.validateQuery({
    limit: { type: 'number', min: 1, max: 20, optional: true },
    type: { type: 'string', enum: ['main', 'step', 'detail', 'comparison'], optional: true }
  }),
  imageController.getPopularImages
);

/**
 * DELETE /api/images/:imageId
 * Delete an image
 */
router.delete('/:imageId',
  auth.required, // Requires authentication
  validation.validateParams({
    imageId: { type: 'string', required: true }
  }),
  imageController.deleteImage
);

/**
 * GET /api/images/stats
 * Get image generation statistics
 */
router.get('/stats',
  auth.required, // Requires authentication for stats
  validation.validateQuery({
    timeRange: { type: 'string', enum: ['1d', '7d', '30d'], optional: true },
    model: { type: 'string', optional: true }
  }),
  imageController.getImageStats
);

module.exports = router;
