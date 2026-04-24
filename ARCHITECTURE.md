 VisualLearn Production Architecture Design

## 1. System Architecture Overview

### Core Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │   MongoDB       │
│   (Zustand)      │◄──►│  (Modular)       │◄──►│   (Mongoose)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AI Services   │
                       │ (OpenAI GPT/DALL·E)│
                       └─────────────────┘
```

### Data Flow Architecture
1. **Request Flow**: Frontend → API Gateway → Classification Service → Content Generation → Cache Layer → Database
2. **Response Flow**: Database → Cache → Response Formatter → Frontend
3. **AI Pipeline**: Topic → Classification → Content Generation → Image Generation → Storage

### Service Boundaries
- **Frontend**: Pure UI state management, no business logic
- **Backend API**: RESTful endpoints, validation, orchestration
- **AI Service**: Isolated OpenAI integration with retry logic
- **Cache Layer**: Redis for hot data, MongoDB for persistence
- **Database**: Topic metadata, generated content, user sessions

## 2. Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── redis.js             # Redis configuration
│   │   ├── openai.js            # OpenAI API setup
│   │   └── environment.js       # Environment validation
│   ├── controllers/
│   │   ├── topicController.js   # Topic CRUD operations
│   │   ├── classificationController.js # AI classification
│   │   ├── contentController.js # Content generation
│   │   └── imageController.js   # Image generation
│   ├── services/
│   │   ├── ai/
│   │   │   ├── classifier.js    # Topic classification logic
│   │   │   ├── contentGenerator.js # JSON content generation
│   │   │   ├── imageGenerator.js # DALL·E integration
│   │   │   └── promptTemplates.js # Structured prompts
│   │   ├── cache/
│   │   │   ├── redisCache.js    # Redis operations
│   │   │   └── cacheStrategy.js # TTL and invalidation
│   │   ├── queue/
│   │   │   ├── bullQueue.js     # Background job processing
│   │   │   └── jobHandlers.js   # AI job processors
│   │   └── storage/
│   │       ├── imageStore.js    # Image URL management
│   │       └── cdnUpload.js     # CDN integration
│   ├── models/
│   │   ├── Topic.js             # Topic schema
│   │   ├── Content.js           # Generated content
│   │   ├── Image.js             # Image metadata
│   │   └── CacheEntry.js        # Cache tracking
│   ├── routes/
│   │   ├── topics.js            # Topic endpoints
│   │   ├── content.js           # Content endpoints
│   │   ├── images.js            # Image endpoints
│   │   └── health.js            # System health
│   ├── middleware/
│   │   ├── rateLimiter.js       # Request throttling
│   │   ├── auth.js              # Authentication
│   │   ├── validation.js        # Input validation
│   │   ├── errorHandler.js      # Centralized error handling
│   │   └── logger.js            # Request logging
│   ├── utils/
│   │   ├── retry.js             # Exponential backoff
│   │   ├── circuitBreaker.js    # Failure isolation
│   │   ├── metrics.js           # Performance tracking
│   │   └── helpers.js           # Common utilities
│   └── app.js                   # Express app setup
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # API tests
│   └── fixtures/                # Test data
├── package.json
├── .env.example
└── server.js
```
