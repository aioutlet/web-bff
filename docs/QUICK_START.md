# Web BFF - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd web-bff
npm install
```

### 2. Environment Setup

The `.env` file has been created with default values. Update service URLs if needed:

```bash
# Services are expected to run on:
# - Product Service: http://localhost:8003
# - Inventory Service: http://localhost:8004
# - Review Service: http://localhost:3002
# - Auth Service: http://localhost:3001
# - User Service: http://localhost:3000
# - Cart Service: http://localhost:8006
# - Order Service: http://localhost:5001
```

### 3. Start Development Server

```bash
npm run dev
```

The BFF service will start on `http://localhost:3100`

### 4. Test the API

**Health Check:**

```bash
curl http://localhost:3100/health
```

**Get Trending Products (with aggregated data):**

```bash
curl http://localhost:3100/api/home/trending
```

**Get Categories:**

```bash
curl http://localhost:3100/api/home/categories
```

## 📁 Project Structure

```
web-bff/
├── src/
│   ├── aggregators/        # Data aggregation logic
│   │   ├── storefront.aggregator.ts
│   │   └── admin.dashboard.aggregator.ts
│   ├── clients/            # HTTP clients for backend services
│   │   ├── base.client.ts
│   │   ├── product.client.ts
│   │   ├── inventory.client.ts
│   │   └── review.client.ts
│   ├── config/             # Configuration
│   │   └── index.ts
│   ├── middleware/         # Express middleware
│   │   ├── correlation-id.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── logging.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── routes/             # API routes
│   │   ├── index.ts
│   │   ├── home.routes.ts
│   │   └── health.routes.ts
│   ├── types/              # TypeScript types (add as needed)
│   ├── utils/              # Utilities
│   │   └── logger.ts
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
└── tests/                  # Test files (to be added)
```

## 🎯 Current Features

### ✅ Implemented

1. **Home Page Aggregation**
   - GET `/api/home/trending` - Trending products with inventory + reviews
   - GET `/api/home/categories` - Product categories

2. **Infrastructure**
   - Correlation IDs for request tracing
   - Structured logging (Winston)
   - Rate limiting
   - Error handling
   - CORS support
   - Retry logic for service calls
   - TypeScript with path aliases

### 🚧 To Be Implemented

1. **Product Aggregation**
   - Product detail page aggregation
   - Product listing with filters

2. **Caching Layer**
   - Redis integration
   - Cache strategies per endpoint

3. **Circuit Breaker**
   - Prevent cascading failures

4. **Authentication**
   - JWT validation middleware

5. **Tests**
   - Unit tests
   - Integration tests

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start with hot reload

# Build
npm run build            # Build TypeScript

# Production
npm start                # Start production server

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:integration # Run integration tests

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking
```

## 🔧 Configuration

All configuration is in `.env` file and `src/config/index.ts`.

### Key Settings:

- **PORT**: BFF service port (default: 3100)
- **SERVICE_TIMEOUT**: Timeout for backend service calls (default: 5000ms)
- **SERVICE_RETRY_COUNT**: Number of retry attempts (default: 3)
- **CACHE_TTL**: Cache time-to-live in seconds (default: 300)
- **RATE_LIMIT_MAX_REQUESTS**: Max requests per window (default: 100)

## 🐛 Debugging

Logs are written to:

- Console (colorized in development)
- `logs/web-bff.log` (all logs)
- `logs/error.log` (errors only)

Each request has a correlation ID for tracing across services.

## 🚀 Next Steps

1. **Install dependencies**: `npm install`
2. **Start backend services** (product, inventory, review)
3. **Run the BFF**: `npm run dev`
4. **Test endpoints** using curl or Postman
5. **Update customer-ui** to call BFF instead of individual services

## 📚 API Documentation

### GET /api/home/trending

Get trending products with aggregated inventory and review data.

**Query Parameters:**

- `limit` (optional): Number of products to return (default: 4)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "product-id",
      "name": "Product Name",
      "price": 99.99,
      "sku": "SKU-123",
      "category": "Electronics",
      "images": ["url1", "url2"],
      "inventory": {
        "inStock": true,
        "availableQuantity": 50
      },
      "reviews": {
        "averageRating": 4.5,
        "reviewCount": 120
      }
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "success": true,
  "service": "web-bff",
  "status": "healthy",
  "timestamp": "2025-10-13T..."
}
```

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Write tests
4. Run `npm run lint` and `npm test`
5. Submit PR

---

**Happy Coding! 🎉**
