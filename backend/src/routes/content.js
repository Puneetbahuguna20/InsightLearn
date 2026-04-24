const express = require('express');
const contentController = require('../controllers/contentController');
const rateLimiter = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all content routes
router.use(rateLimiter.createContentLimiter());

// Validation schemas
const generateContentSchema = {
  regenerate: { type: 'boolean', optional: true },
  version: { type: 'number', min: 1, optional: true },
  improvements: { type: 'object', optional: true }
};

const regenerateContentSchema = {
  improvements: {
    type: 'object',
    optional: true,
    properties: {
      complexity: { type: 'string', enum: ['basic', 'intermediate', 'advanced'] },
      focus: { type: 'string', maxLength: 200 },
      excludeTopics: { type: 'array', items: { type: 'string' } }
    }
  }
};

const addFeedbackSchema = {
  rating: { type: 'number', min: 1, max: 5, required: true },
  comment: { type: 'string', maxLength: 500, optional: true }
};

/**
 * POST /api/content/:topicId/generate
 * Generate content for a topic
 */
router.post('/:topicId/generate',
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  validation.validate(generateContentSchema),
  contentController.generateContent
);

/**
 * GET /api/content/:topicId
 * Get content for a topic
 */
router.get('/:topicId',
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  validation.validateQuery({
    step: { type: 'number', min: 0, optional: true },
    format: { type: 'string', enum: ['json', 'html'], optional: true }
  }),
  contentController.getContent
);

/**
 * GET /api/content/:topicId/step/:stepIndex
 * Get specific step of process/algorithm content
 */
router.get('/:topicId/step/:stepIndex',
  validation.validateParams({
    topicId: { type: 'string', required: true },
    stepIndex: { type: 'number', min: 0, required: true }
  }),
  contentController.getStepContent
);

/**
 * POST /api/content/:topicId/regenerate
 * Regenerate content with improvements
 */
router.post('/:topicId/regenerate',
  auth.optional, // Optional authentication
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  validation.validate(regenerateContentSchema),
  contentController.regenerateContent
);

/**
 * PUT /api/content/:contentId
 * Update content metadata
 */
router.put('/:contentId',
  auth.required, // Requires authentication
  validation.validateParams({
    contentId: { type: 'string', required: true }
  }),
  validation.validate({
    status: { type: 'string', enum: ['draft', 'ready', 'published', 'archived'], optional: true },
    'data.summary': { type: 'string', maxLength: 1000, optional: true },
    'data.learningObjectives': { type: 'array', items: { type: 'string', maxLength: 200 }, optional: true }
  }),
  contentController.updateContent
);

/**
 * DELETE /api/content/:contentId
 * Delete content (soft delete)
 */
router.delete('/:contentId',
  auth.required, // Requires authentication
  validation.validateParams({
    contentId: { type: 'string', required: true }
  }),
  contentController.deleteContent
);

/**
 * POST /api/content/:contentId/feedback
 * Add feedback to content
 */
router.post('/:contentId/feedback',
  validation.validateParams({
    contentId: { type: 'string', required: true }
  }),
  validation.validate(addFeedbackSchema),
  contentController.addFeedback
);

/**
 * GET /api/content/popular
 * Get popular content
 */
router.get('/popular',
  validation.validateQuery({
    limit: { type: 'number', min: 1, max: 50, optional: true },
    type: { type: 'string', enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'], optional: true },
    timeRange: { type: 'string', enum: ['1d', '7d', '30d'], optional: true }
  }),
  contentController.getPopularContent
);

/**
 * GET /api/content/type/:type
 * Get content by type
 */
router.get('/type/:type',
  validation.validateParams({
    type: { type: 'string', enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'], required: true }
  }),
  validation.validateQuery({
    limit: { type: 'number', min: 1, max: 100, optional: true },
    sortBy: { type: 'string', enum: ['views', 'rating', 'recent'], optional: true }
  }),
  contentController.getContentByType
);

/**
 * GET /api/content/search
 * Search content
 */
router.get('/search',
  validation.validateQuery({
    query: { type: 'string', maxLength: 100, optional: true },
    type: { type: 'string', enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'], optional: true },
    domain: { type: 'string', maxLength: 50, optional: true },
    complexity: { type: 'string', enum: ['basic', 'intermediate', 'advanced'], optional: true },
    limit: { type: 'number', min: 1, max: 100, optional: true },
    offset: { type: 'number', min: 0, optional: true }
  }),
  contentController.searchContent
);

/**
 * GET /api/content/:contentId/stats
 * Get content statistics
 */
router.get('/:contentId/stats',
  validation.validateParams({
    contentId: { type: 'string', required: true }
  }),
  contentController.getContentStats
);

module.exports = router;
