const express = require('express');
const topicController = require('../controllers/topicController');
const rateLimiter = require('../middleware/rateLimiter');
const validation = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all topic routes
router.use(rateLimiter);

// Validation schemas
const createTopicSchema = {
  topic: { type: 'string', minLength: 3, maxLength: 500, required: true },
  userId: { type: 'string', optional: true },
  metadata: {
    type: 'object',
    optional: true,
    properties: {
      language: { type: 'string', enum: ['en', 'es', 'fr', 'de', 'zh'], optional: true },
      complexity: { type: 'string', enum: ['basic', 'intermediate', 'advanced'], optional: true },
      domain: { type: 'string', maxLength: 50, optional: true },
      tags: { type: 'array', items: { type: 'string', maxLength: 30 }, optional: true }
    }
  }
};

const classifyTopicSchema = {
  topic: { type: 'string', minLength: 3, maxLength: 500, required: true },
  userId: { type: 'string', optional: true }
};

const updateTopicSchema = {
  'metadata.complexity': { type: 'string', enum: ['basic', 'intermediate', 'advanced'], optional: true },
  'metadata.domain': { type: 'string', maxLength: 50, optional: true },
  'metadata.tags': { type: 'array', items: { type: 'string', maxLength: 30 }, optional: true }
};

const rateTopicSchema = {
  rating: { type: 'number', min: 1, max: 5, required: true }
};

const improveClassificationSchema = {
  correctType: { 
    type: 'string', 
    enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'], 
    required: true 
  },
  feedback: { type: 'string', maxLength: 500, optional: true }
};

// Routes

/**
 * POST /api/topics
 * Create a new topic or get existing one
 */
router.post('/', 
  validation.validate(createTopicSchema),
  topicController.createTopic
);

/**
 * POST /api/topics/classify
 * Classify a topic without creating it
 */
router.post('/classify', 
  validation.validate(classifyTopicSchema),
  topicController.classifyTopic
);

/**
 * GET /api/topics
 * Search topics with filters
 */
router.get('/', 
  validation.validateQuery({
    query: { type: 'string', maxLength: 100, optional: true },
    type: { type: 'string', enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'], optional: true },
    domain: { type: 'string', maxLength: 50, optional: true },
    complexity: { type: 'string', enum: ['basic', 'intermediate', 'advanced'], optional: true },
    limit: { type: 'number', min: 1, max: 100, optional: true },
    offset: { type: 'number', min: 0, optional: true },
    sortBy: { type: 'string', enum: ['popularity', 'recent', 'requests'], optional: true },
    sortOrder: { type: 'string', enum: ['asc', 'desc'], optional: true }
  }),
  topicController.searchTopics
);

/**
 * GET /api/topics/popular
 * Get popular topics
 */
router.get('/popular', 
  validation.validateQuery({
    limit: { type: 'number', min: 1, max: 50, optional: true },
    domain: { type: 'string', maxLength: 50, optional: true }
  }),
  topicController.getPopularTopics
);

/**
 * GET /api/topics/type/:type
 * Get topics by classification type
 */
router.get('/type/:type', 
  validation.validateParams({
    type: { type: 'string', enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'] }
  }),
  validation.validateQuery({
    limit: { type: 'number', min: 1, max: 100, optional: true }
  }),
  topicController.getTopicsByType
);

/**
 * GET /api/topics/:topicId
 * Get a specific topic
 */
router.get('/:topicId', 
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  topicController.getTopic
);

/**
 * PUT /api/topics/:topicId
 * Update topic metadata
 */
router.put('/:topicId', 
  auth.optional, // Optional authentication
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  validation.validate(updateTopicSchema),
  topicController.updateTopic
);

/**
 * DELETE /api/topics/:topicId
 * Soft delete a topic (archive)
 */
router.delete('/:topicId', 
  auth.required, // Requires authentication
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  topicController.deleteTopic
);

/**
 * POST /api/topics/:topicId/rate
 * Rate a topic
 */
router.post('/:topicId/rate', 
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  validation.validate(rateTopicSchema),
  topicController.rateTopic
);

/**
 * POST /api/topics/:topicId/improve-classification
 * Improve topic classification with user feedback
 */
router.post('/:topicId/improve-classification', 
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  validation.validate(improveClassificationSchema),
  topicController.improveClassification
);

/**
 * GET /api/topics/:topicId/similar
 * Get similar topics
 */
router.get('/:topicId/similar', 
  validation.validateParams({
    topicId: { type: 'string', required: true }
  }),
  validation.validateQuery({
    limit: { type: 'number', min: 1, max: 20, optional: true }
  }),
  topicController.getSimilarTopics
);

module.exports = router;
