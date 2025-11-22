# CXO Virtual Assistant - SaaS Platform

An AI-powered executive assistant designed for CXOs to manage time, calendar, meetings, and daily operations with intelligent automation.

## 🚀 Features

### Core Features
- **Time & Calendar Intelligence**: Real-time bidirectional sync with Google Calendar, Microsoft Outlook, and Apple Calendar
- **Smart Meeting Preparation**: Automated preparation packages 24 hours before meetings
- **Daily Briefings**: Morning, midday, end-of-day, and weekly digest briefings
- **Voice Input**: Browser-based voice commands for natural language queries
- **Intelligent Scheduling**: Automatic conflict detection, focus time blocking, and meeting optimization
- **Pattern Recognition**: Detects weekly, monthly, and quarterly meeting patterns
- **Query Intelligence**: Natural language processing with timezone awareness

### Web Application Features
- **Dashboard**: Personalized overview with priorities, schedule, and quick stats
- **Calendar View**: Visual calendar with event management
- **Meetings**: Meeting list with preparation status and notes
- **Briefings**: Access to all generated briefings
- **Voice Input**: Integrated voice commands throughout the app
- **Settings**: User preferences, work hours, timezone, notifications

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Search**: Elasticsearch
- **Queue**: RabbitMQ
- **Authentication**: JWT + OAuth 2.0 (Google, Microsoft, Apple)
- **AI/ML**: OpenAI GPT-4 / Anthropic Claude

### Frontend
- **Framework**: React 18 with JSX
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (production)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis (or use Docker)

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone https://github.com/your-org/CXO_Virtual_Assistant_MVP.git
cd CXO_Virtual_Assistant_MVP
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start all services with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the application**
- Web App: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health

### Manual Setup (Development)

1. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install web dependencies
cd ../web && npm install
```

2. **Set up database**
```bash
# Start PostgreSQL (or use Docker)
docker-compose up -d postgres redis

# Database will be initialized automatically with schema
```

3. **Start development servers**
```bash
# From root directory
npm run dev

# Or separately:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Web
cd web && npm run dev
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all configuration options. Key variables:

```bash
# Database
DATABASE_URL=postgresql://cxo_user:cxo_password@localhost:5432/cxo_assistant

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# SendGrid Email
SENDGRID_API_KEY=your-sendgrid-api-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### OAuth Setup

#### Google Calendar Integration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/v1/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

#### Microsoft Outlook Integration
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new app in Azure AD
3. Add Microsoft Graph API permissions: `Calendars.ReadWrite`
4. Add redirect URI: `http://localhost:3000/api/v1/auth/microsoft/callback`
5. Copy Application (client) ID and Client Secret to `.env`

## 📚 API Documentation

### Authentication

#### POST /api/v1/auth/login
Login with email (development mode)

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### GET /api/v1/auth/me
Get current authenticated user

**Headers:**
```
Authorization: Bearer {token}
```

### Calendar

#### GET /api/v1/calendars
Get all connected calendars

#### GET /api/v1/calendars/:id/sync
Trigger calendar sync

### Events

#### GET /api/v1/events?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
Get events in date range

#### POST /api/v1/events
Create new event

### Meetings

#### GET /api/v1/meetings
Get all meetings

#### GET /api/v1/meetings/:id/preparation
Get meeting preparation package

### Queries

#### POST /api/v1/queries/ask
Submit natural language query

**Request:**
```json
{
  "query_text": "What meetings do I have tomorrow?"
}
```

### Briefings

#### GET /api/v1/briefings/:type
Get briefing by type (morning, midday, eod, weekly)

## 🏗️ Project Structure

```
CXO_Virtual_Assistant_MVP/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── api/            # API routes and controllers
│   │   ├── services/       # Business logic services
│   │   ├── agents/         # AI agents
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utilities
│   └── Dockerfile
├── web/                    # React web application
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # State management
│   │   └── App.jsx
│   └── Dockerfile
├── infrastructure/         # Infrastructure configs
│   ├── docker/
│   └── kubernetes/
├── docs/                   # Documentation
├── docker-compose.yml      # Docker Compose config
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🚢 Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Apply Kubernetes configurations
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods
kubectl get services
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Web tests
cd web && npm test

# E2E tests
npm run test:e2e
```

## 📊 Monitoring & Logging

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f web

# Application logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

## 🔒 Security

- JWT-based authentication with refresh tokens
- OAuth 2.0 for calendar integrations
- Rate limiting on all API endpoints
- Helmet.js for HTTP security headers
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- Encrypted storage of OAuth tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 💬 Support

For support, email support@yourcompany.ai or open an issue in the repository.

## 🗺️ Roadmap

### Phase 1 (Current - MVP)
- ✅ Single-user calendar integration
- ✅ Basic meeting preparation
- ✅ Daily briefings
- ✅ Voice input
- ✅ Web application

### Phase 2 (Next 3-6 months)
- Multi-user support
- Microsoft Outlook integration
- Apple Calendar integration
- Advanced analytics
- Mobile app (React Native)

### Phase 3 (6-9 months)
- Team collaboration features
- Predictive scheduling
- Advanced AI insights
- Integration with CRM systems

## 📞 Contact

- Website: https://yourcompany.ai
- Email: contact@yourcompany.ai
- Twitter: @yourcompany

---

**Built with ❤️ for CXOs**
