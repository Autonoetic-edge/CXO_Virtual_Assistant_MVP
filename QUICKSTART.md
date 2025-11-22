# 🚀 Quick Start Guide

Get the CXO Virtual Assistant running in under 5 minutes!

## Prerequisites

Make sure you have installed:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Node.js 18+](https://nodejs.org/) (for local development)

## Option 1: Docker (Recommended)

### 1. Clone and Setup

```bash
git clone https://github.com/Autonoetic-edge/CXO_Virtual_Assistant_MVP.git
cd CXO_Virtual_Assistant_MVP
cp .env.example .env
```

### 2. Start Everything with Docker

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Backend API (port 3000)
- Web application (port 5173)
- Elasticsearch (port 9200)
- RabbitMQ (port 5672, 15672)

### 3. Access the Application

- **Web App**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 4. Login

In development mode, any email works:
- Email: `demo@cxoassistant.com` (or any email)
- Click "Sign In"

## Option 2: Local Development

### 1. Setup

```bash
# Clone and configure
git clone https://github.com/Autonoetic-edge/CXO_Virtual_Assistant_MVP.git
cd CXO_Virtual_Assistant_MVP
cp .env.example .env

# Install dependencies
npm install
```

### 2. Start Database Services

```bash
docker-compose up -d postgres redis
```

### 3. Start Development Servers

```bash
# From root directory (starts both backend and web)
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Web
cd web
npm install
npm run dev
```

### 4. Access the Application

- Web App: http://localhost:5173
- Backend API: http://localhost:3000

## 🎯 What Can You Do?

### 1. Dashboard
- View your daily priorities
- See today's schedule
- Check quick stats
- Use voice input to ask questions

### 2. Voice Input
Click the microphone icon and try:
- "What meetings do I have tomorrow?"
- "Am I free on December 5th?"
- "Show my calendar for next week"

### 3. Calendar
- View all your events
- Sync with Google Calendar (requires OAuth setup)
- Create new events

### 4. Meetings
- View upcoming meetings
- Check preparation status
- Add meeting notes

### 5. Briefings
- Access daily briefings (Morning, EOD)
- View weekly digests
- Download briefing reports

### 6. Settings
- Configure work hours
- Set timezone
- Manage notification preferences

## 🔧 Configuration

### Minimal Configuration (Works Out of the Box)

The `.env.example` file has sensible defaults. For full functionality, configure:

### Google Calendar Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add to `.env`:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### OpenAI Integration (for AI features)

Get your API key from [OpenAI](https://platform.openai.com/):
```bash
OPENAI_API_KEY=sk-your-api-key
```

### Email Notifications

Sign up for [SendGrid](https://sendgrid.com/) and add:
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=assistant@yourcompany.ai
```

## 📊 Verify Everything is Working

### 1. Check Docker Services

```bash
docker-compose ps
```

All services should show as "Up"

### 2. Check Backend Health

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 123.456
}
```

### 3. Check Database

```bash
docker exec -it cxo-postgres psql -U cxo_user -d cxo_assistant -c "\dt"
```

Should list all tables (users, calendars, events, meetings, etc.)

### 4. Check Web App

Open http://localhost:5173 - you should see the login page

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill processes using ports
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Web
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### Docker Issues

```bash
# Stop all services
docker-compose down

# Remove volumes and restart fresh
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Web App Not Loading

```bash
# Check if backend is running
curl http://localhost:3000/health

# Rebuild web app
cd web
npm install
npm run dev
```

## 📚 Next Steps

1. **Read the full documentation**
   - [README.md](README.md) - Complete overview
   - [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development guide
   - [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment

2. **Configure Integrations**
   - Set up Google Calendar OAuth
   - Configure SendGrid for emails
   - Set up Slack integration

3. **Customize for Your Needs**
   - Adjust work hours in Settings
   - Configure timezone
   - Set up notification preferences

4. **Explore Features**
   - Try voice commands
   - Create test meetings
   - View generated briefings

## 💡 Tips

- **Development Mode**: Auto-creates users on login with any email
- **Voice Input**: Works best in Chrome/Edge (uses Web Speech API)
- **Calendar Sync**: Requires OAuth setup for Google/Outlook
- **Hot Reload**: Both frontend and backend auto-reload on changes
- **Docker**: Use `docker-compose logs -f service-name` to view logs

## 🆘 Need Help?

- Check [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development info
- View [README.md](README.md) for comprehensive documentation
- Open an issue on GitHub
- Contact: support@yourcompany.ai

## 🎉 You're All Set!

Your CXO Virtual Assistant is now running. Start by:
1. Logging in at http://localhost:5173
2. Exploring the Dashboard
3. Trying out voice commands
4. Creating a test meeting
5. Viewing your briefing

**Happy productivity! 🚀**
