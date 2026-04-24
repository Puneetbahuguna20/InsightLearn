const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'REDIS_URL',
  'OPENAI_API_KEY'
];

const optionalEnvVars = {
  'REDIS_PASSWORD': '',
  'CDN_BUCKET': '',
  'CDN_REGION': 'us-east-1',
  'JWT_SECRET': 'default-secret-change-in-production',
  'RATE_LIMIT_WINDOW_MS': '900000',
  'RATE_LIMIT_MAX_REQUESTS': '100',
  'CACHE_TTL_CLASSIFICATION': '86400',
  'CACHE_TTL_CONTENT': '604800',
  'CACHE_TTL_IMAGES': '2592000'
};

// Validate required environment variables
const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Build configuration object
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    }
  },
  
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD || null,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    models: {
      classification: 'gpt-3.5-turbo',
      content: 'gpt-4',
      vision: 'gpt-4-vision-preview',
      image: 'dall-e-3'
    },
    maxTokens: {
      classification: 500,
      content: 2000,
      vision: 1000
    }
  },
  
  cdn: {
    bucket: process.env.CDN_BUCKET || '',
    region: process.env.CDN_REGION || 'us-east-1'
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    bcryptRounds: 12
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  cache: {
    ttl: {
      classification: parseInt(process.env.CACHE_TTL_CLASSIFICATION) || 86400, // 24h
      content: parseInt(process.env.CACHE_TTL_CONTENT) || 604800, // 7d
      images: parseInt(process.env.CACHE_TTL_IMAGES) || 2592000, // 30d
      regions: 3600 // 1h
    }
  },
  
  queue: {
    concurrency: {
      imageGeneration: 3,
      contentGeneration: 5
    },
    jobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  },
  
  costs: {
    gpt35: 0.002, // per 1K tokens
    gpt4: 0.03,   // per 1K tokens
    gpt4Vision: 0.03, // per 1K tokens
    dallE3: 0.04 // per image
  }
};

// Validate environment on import
if (config.env === 'production') {
  validateEnvironment();
}

module.exports = config;
