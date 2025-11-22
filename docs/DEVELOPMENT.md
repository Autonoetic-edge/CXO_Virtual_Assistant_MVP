# Development Guide

## Getting Started

### Setting Up Development Environment

1. **Clone the repository**
```bash
git clone https://github.com/your-org/CXO_Virtual_Assistant_MVP.git
cd CXO_Virtual_Assistant_MVP
```

2. **Install Node.js 18+**
- Download from https://nodejs.org/
- Verify installation: `node --version` and `npm --version`

3. **Install dependencies**
```bash
npm install
cd backend && npm install
cd ../web && npm install
cd ..
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your local configuration
```

5. **Start Docker services**
```bash
docker-compose up -d postgres redis
```

6. **Initialize database**
The database will be automatically initialized with the schema when PostgreSQL starts.

7. **Start development servers**
```bash
# From root directory
npm run dev

# This starts both backend (port 3000) and web (port 5173)
```

## Project Structure

### Backend (`/backend`)

```
backend/
├── src/
│   ├── index.ts              # Application entry point
│   ├── config/               # Configuration files
│   │   ├── index.ts          # Main config
│   │   ├── database.ts       # Database connection
│   │   └── redis.ts          # Redis connection
│   ├── api/                  # API layer
│   │   ├── routes/           # Express routes
│   │   └── controllers/      # Route controllers
│   ├── models/               # Database models
│   │   ├── User.ts
│   │   ├── Calendar.ts
│   │   ├── Event.ts
│   │   └── Meeting.ts
│   ├── services/             # Business logic
│   │   ├── CalendarSyncService.ts
│   │   ├── BriefingService.ts
│   │   └── ...
│   ├── agents/               # AI agents
│   │   ├── PreparationAgent.ts
│   │   ├── BriefingAgent.ts
│   │   └── ...
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   └── utils/                # Utilities
│       └── logger.ts
├── package.json
└── tsconfig.json
```

### Web (`/web`)

```
web/
├── src/
│   ├── main.jsx              # Application entry
│   ├── App.jsx               # Root component
│   ├── pages/                # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Calendar.jsx
│   │   ├── Meetings.jsx
│   │   ├── Briefings.jsx
│   │   └── Settings.jsx
│   ├── components/           # Reusable components
│   │   ├── Layout.jsx
│   │   ├── VoiceInput.jsx
│   │   └── PrivateRoute.jsx
│   ├── services/             # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── calendarService.js
│   ├── hooks/                # Custom hooks
│   │   └── useVoiceInput.js
│   ├── store/                # State management
│   │   └── authStore.js
│   └── index.css             # Global styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Development Workflow

### Running Individual Services

**Backend only:**
```bash
cd backend
npm run dev
```

**Web only:**
```bash
cd web
npm run dev
```

### Code Style

#### TypeScript/JavaScript

We use ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Format code
npm run format
```

#### Naming Conventions

- **Files**: PascalCase for components/models, camelCase for utilities
- **Components**: PascalCase (e.g., `VoiceInput.jsx`)
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Database tables**: snake_case (e.g., `user_preferences`)

### Git Workflow

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: add amazing feature"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

3. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

## Adding New Features

### Adding a New API Endpoint

1. **Create route file** (`backend/src/api/routes/yourRoute.ts`):
```typescript
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ message: 'Your route' });
});

export default router;
```

2. **Register route** in `backend/src/index.ts`:
```typescript
import yourRoutes from './api/routes/yourRoute';
app.use('/api/v1/your-route', yourRoutes);
```

3. **Create controller** (`backend/src/api/controllers/yourController.ts`)
4. **Create service** (`backend/src/services/YourService.ts`)
5. **Add tests**

### Adding a New Page

1. **Create page component** (`web/src/pages/YourPage.jsx`):
```jsx
import React from 'react';

const YourPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Page</h1>
      {/* Your content */}
    </div>
  );
};

export default YourPage;
```

2. **Add route** in `web/src/App.jsx`:
```jsx
<Route path="your-page" element={<YourPage />} />
```

3. **Add navigation** in `web/src/components/Layout.jsx`

### Adding a New Service

1. **Create service file** (`backend/src/services/YourService.ts`):
```typescript
export class YourService {
  static async doSomething(): Promise<any> {
    // Implementation
  }
}
```

2. **Use in controller**:
```typescript
import { YourService } from '../../services/YourService';

const result = await YourService.doSomething();
```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

Test file structure:
```
backend/
└── src/
    └── __tests__/
        ├── models/
        ├── services/
        └── api/
```

Example test:
```typescript
import { UserModel } from '../models/User';

describe('UserModel', () => {
  it('should create a user', async () => {
    const user = await UserModel.create({
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    });
    expect(user.email).toBe('test@example.com');
  });
});
```

### Web Tests

```bash
cd web
npm test
```

## Debugging

### Backend Debugging

Add to `backend/src/index.ts`:
```typescript
import logger from './utils/logger';

logger.debug('Debug message', { data: someData });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Web Debugging

Use React DevTools browser extension and:
```javascript
console.log('Debug:', data);
```

### Database Debugging

```bash
# Connect to PostgreSQL
docker exec -it cxo-postgres psql -U cxo_user -d cxo_assistant

# View tables
\dt

# Query data
SELECT * FROM users;
SELECT * FROM events WHERE user_id = 'some-id';
```

### Redis Debugging

```bash
# Connect to Redis
docker exec -it cxo-redis redis-cli

# View all keys
KEYS *

# Get a value
GET some-key

# Delete a key
DEL some-key
```

## Common Development Tasks

### Reset Database

```bash
docker-compose down -v
docker-compose up -d postgres
# Database will be re-initialized
```

### Clear Redis Cache

```bash
docker exec -it cxo-redis redis-cli FLUSHALL
```

### View Logs

```bash
# Backend logs
tail -f backend/logs/combined.log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f web
```

### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update
```

## Environment Variables

### Backend Environment Variables

Key variables for development:
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://cxo_user:cxo_password@localhost:5432/cxo_assistant
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
```

### Web Environment Variables

Create `.env` in web directory:
```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Performance Optimization

### Backend

1. **Use Redis caching**
```typescript
import { cache } from '../config/redis';

// Cache data
await cache.set('key', data, 3600); // 1 hour

// Get cached data
const cachedData = await cache.get('key');
```

2. **Database query optimization**
- Use indexes on frequently queried columns
- Limit query results
- Use database connection pooling

3. **Rate limiting**
Already implemented in `middleware/rateLimiter.ts`

### Frontend

1. **Code splitting**
```jsx
const LazyComponent = React.lazy(() => import('./components/HeavyComponent'));
```

2. **Memoization**
```jsx
const MemoizedComponent = React.memo(Component);
```

3. **Optimize images**
- Use appropriate formats (WebP)
- Lazy load images
- Use CDN

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres
```

**Redis connection failed:**
```bash
# Check Redis is running
docker ps | grep redis

# Restart Redis
docker-compose restart redis
```

**Module not found:**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Best Practices

1. **Never commit secrets** - Use `.env` files (gitignored)
2. **Write tests** - Aim for 80%+ coverage
3. **Use TypeScript types** - Avoid `any` type
4. **Error handling** - Always handle errors gracefully
5. **Logging** - Use logger instead of console.log
6. **Code review** - All changes need PR review
7. **Documentation** - Update docs when adding features

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

For questions, contact the development team or open an issue.
