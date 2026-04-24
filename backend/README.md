# VisualLearn Backend API

AI-powered educational content generation platform backend service.

## Features

- **Topic Classification**: Automatically classify educational topics into structure, process, algorithm, hierarchy, or comparison types
- **Content Generation**: Generate educational content using OpenAI GPT models
- **Image Generation**: Create educational diagrams using DALL·E
- **Interactive Regions**: Add clickable regions to images for enhanced learning
- **Multi-step Content**: Support for process and algorithm content with step navigation
- **Caching Strategy**: Redis-based caching to reduce AI costs
- **Rate Limiting**: Configurable rate limiting for API endpoints
- **Error Handling**: Comprehensive error handling with retry logic
- **Monitoring**: Health checks and metrics collection

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **AI Services**: OpenAI API (GPT-4, DALL·E 3)
- **Queue**: Bull Queue for background processing
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- MongoDB 5.0+
- Redis 6.0+
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd visuallearn/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/visuallearn
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check
```http
GET /api/health
```

### Topics

#### Create/Classify Topic
```http
POST /api/topics
Content-Type: application/json

{
  "topic": "Photosynthesis process",
  "userId": "optional-user-id",
  "metadata": {
    "complexity": "intermediate",
    "domain": "science",
    "tags": ["biology", "plants"]
  }
}
```

#### Get Topic
```http
GET /api/topics/:topicId
```

#### Search Topics
```http
GET /api/topics?query=photosynthesis&type=process&limit=10
```

### Content

#### Generate Content
```http
POST /api/content/:topicId/generate
Content-Type: application/json

{
  "regenerate": false,
  "version": 1
}
```

#### Get Content
```http
GET /api/content/:topicId?step=1&format=json
```

#### Get Step Content
```http
GET /api/content/:topicId/step/:stepIndex
```

### Images

#### Generate Image
```http
POST /api/images/generate
Content-Type: application/json

{
  "prompt": "Educational diagram showing photosynthesis process",
  "size": "1024x1024",
  "quality": "standard",
  "style": "natural"
}
```

#### Get Image Regions
```http
GET /api/images/:imageId/regions
```

#### Add Clickable Region
```http
POST /api/images/:imageId/regions
Content-Type: application/json

{
  "id": "region-1",
  "type": "label",
  "coordinates": {"x": 100, "y": 150, "width": 80, "height": 30},
  "content": "Chlorophyll absorbs sunlight",
  "action": "show-detail"
}
```

## Architecture

### Folder Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic services
│   │   ├── ai/         # AI service integrations
│   │   ├── cache/      # Cache management
│   │   ├── queue/      # Background job processing
│   │   └── storage/    # File storage services
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   └── app.js          # Express app setup
├── tests/               # Test files
├── package.json
└── server.js           # Server entry point
```

### Data Models

#### Topic
- Original and normalized text
- Classification (type, confidence, model)
- Metadata (user, domain, complexity, tags)
- Usage statistics

#### Content
- Topic reference and type
- Type-specific data (steps, labels, nodes, items)
- Generation metadata
- Interaction analytics

#### Image
- Topic and content references
- URLs (original, thumbnail, optimized)
- Generation details
- Clickable regions
- Analytics

### AI Pipeline

1. **Classification**: Topic → GPT Classification → Type Assignment
2. **Content Generation**: Type + Topic → GPT Content → Structured Data
3. **Image Generation**: Content Prompts → DALL·E → Educational Images
4. **Region Detection**: Images + Context → GPT Vision → Interactive Areas

### Caching Strategy

- **Classification**: 24 hours TTL
- **Content**: 7 days TTL
- **Images**: 30 days TTL
- **Regions**: 1 hour TTL

## Environment Variables

### Required
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key

### Optional
- `JWT_SECRET`: JWT signing secret
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window
- `CACHE_TTL_*`: Cache TTL values
- `CDN_BUCKET`: AWS S3 bucket for images
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

## Development

### Scripts

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/classifier.test.js
```

### Database Seeding

```bash
npm run seed
```

## Deployment

### Production Setup

1. Set production environment variables
2. Build and deploy to your preferred platform
3. Ensure MongoDB and Redis are accessible
4. Configure SSL/TLS termination
5. Set up monitoring and logging

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific Configurations

- **Development**: Detailed logging, CORS enabled, hot reload
- **Production**: Optimized logging, security headers, compression

## Monitoring

### Health Checks

- `/api/health` - Basic health status
- `/api/health/detailed` - Detailed system metrics
- `/api/health/readiness` - Kubernetes readiness probe
- `/api/health/liveness` - Kubernetes liveness probe

### Metrics

- Request/response times
- AI service usage and costs
- Cache hit rates
- Error rates
- Database performance

## Security

- Rate limiting on all endpoints
- Input validation and sanitization
- JWT-based authentication
- CORS configuration
- Security headers with Helmet
- Request logging and monitoring

## Cost Optimization

- Multi-level caching strategy
- Content deduplication
- Token usage tracking
- Model selection based on complexity
- Retry logic with exponential backoff

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the API documentation
- Review the health check endpoints
