# CXO Virtual Assistant - MVP Features Guide

This guide covers all the new features implemented in the CXO Virtual Assistant MVP, providing detailed instructions on how to use each feature.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Gamified Onboarding](#gamified-onboarding)
3. [Daily Workflows (Briefings)](#daily-workflows-briefings)
4. [Personal Memory System](#personal-memory-system)
5. [Task Management](#task-management)
6. [Reminder System](#reminder-system)
7. [Integrations (Notion & Trello)](#integrations-notion--trello)
8. [API Reference](#api-reference)

---

## Getting Started

### Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL 15+ (handled by Docker)
- Redis 7+ (handled by Docker)

### Quick Start

```bash
# Clone and navigate to project
cd CXO_Virtual_Assistant_MVP

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

### First-Time User Flow

1. Navigate to `http://localhost:5173`
2. Enter your email to log in (development mode accepts any email)
3. Complete the onboarding wizard to personalize your assistant
4. Access your personalized dashboard

---

## Gamified Onboarding

The onboarding system collects your preferences through a fun, step-by-step wizard.

### Steps

| Step | Name | What It Collects |
|------|------|------------------|
| 1 | Welcome | Introduction to the assistant |
| 2 | Daily Routine | Wake/sleep times, work hours, break schedule |
| 3 | Habits | Habits to track (exercise, meditation, reading, etc.) |
| 4 | Important Dates | Birthdays, anniversaries, renewals |
| 5 | Preferences | Communication tone, productivity style, motivation style |
| 6 | Completion | Summary and confirmation |

### Accessing Onboarding

- **URL:** `/onboarding`
- New users are automatically directed here
- Return anytime via Settings to update preferences

### Preference Options

**Communication Tone:**
- `casual` - Relaxed, informal language
- `professional` - Business-appropriate tone
- `friendly` - Warm and personable
- `formal` - Structured, official language

**Productivity Style:**
- `focused` - Deep work blocks, minimal interruptions
- `balanced` - Mix of work and breaks
- `flexible` - Adapt as needed throughout the day

**Motivation Style:**
- `direct` - Straight to the point
- `encouraging` - Supportive and positive
- `data-driven` - Statistics and metrics focused

---

## Daily Workflows (Briefings)

The assistant generates personalized briefings based on your schedule, tasks, and preferences.

### Briefing Types

| Type | When Generated | Content |
|------|---------------|---------|
| **Morning** | Start of day | Today's tasks, events, reminders, motivational message |
| **Midday** | Around noon | Progress check, pending tasks, upcoming events |
| **Evening** | End of day | Day summary, completed tasks, tomorrow's preview |

### How to Access

- **Dashboard:** Automatically shows today's relevant briefing
- **Briefings Page:** `/briefings` for historical view
- **API:** `GET /api/v1/workflows/today`

### Briefing Content Structure

```json
{
  "greeting": "Good morning! Hope you slept well!",
  "summary": "You have 5 tasks for today. 2 meetings scheduled.",
  "tasks": [...],
  "reminders": [...],
  "events": [...],
  "upcomingMemories": [...],
  "motivationalMessage": "You've got this! Make today count.",
  "actionItems": ["Review pending tasks", "Prepare for 10 AM meeting"]
}
```

---

## Personal Memory System

Store personal information that the assistant remembers and uses to personalize your experience.

### Memory Types

| Type | Description | Example |
|------|-------------|---------|
| `birthday` | Birthdays to remember | "Mom's birthday is May 15" |
| `anniversary` | Special anniversaries | "Wedding anniversary on June 20" |
| `preference` | Personal preferences | "I prefer morning meetings" |
| `note` | General notes | "Project deadline is end of Q4" |
| `fact` | Personal facts | "Allergic to shellfish" |
| `person` | People information | "John is my accountant" |

### Creating Memories

**Method 1: Dashboard Quick Command**
```
Type: "Remember that Mom's birthday is on May 15th"
```

**Method 2: API**
```bash
POST /api/v1/memories/remember
{
  "text": "Remember that Mom's birthday is on May 15th"
}
```

**Method 3: Detailed Creation**
```bash
POST /api/v1/memories
{
  "memory_type": "birthday",
  "title": "Mom's Birthday",
  "content": "Don't forget to call and send flowers",
  "reminder_enabled": true,
  "reminder_date": "2025-05-15",
  "reminder_recurrence": "yearly"
}
```

### Searching Memories

```bash
# Search by keyword
GET /api/v1/memories/search?q=birthday

# Get by type
GET /api/v1/memories/type/birthday

# Get relevant memories (RAG-style)
GET /api/v1/memories/relevant?q=family events
```

### Memory Reminders

Memories can have automatic reminders:
- **yearly** - Annual reminders (birthdays, anniversaries)
- **monthly** - Monthly reminders
- **weekly** - Weekly reminders
- **once** - One-time reminder

---

## Task Management

Full-featured to-do list system with priorities, due dates, and external sync.

### Creating Tasks

**Via UI:**
1. Go to Tasks page (`/tasks`)
2. Click "Add Task"
3. Fill in title, description, priority, due date
4. Click "Add Task"

**Via API:**
```bash
POST /api/v1/tasks
{
  "title": "Review quarterly report",
  "description": "Analyze Q4 financials",
  "priority": "high",
  "due_date": "2025-12-10",
  "due_time": "14:00",
  "list_name": "work",
  "category": "finance"
}
```

### Task Priorities

| Priority | Color | Use Case |
|----------|-------|----------|
| `urgent` | 🔴 Red | Immediate attention required |
| `high` | 🟠 Orange | Important, do soon |
| `medium` | 🔵 Blue | Normal priority |
| `low` | ⚪ Gray | When time permits |

### Task Lists

Organize tasks into lists:
- `default` - General tasks
- `work` - Work-related tasks
- `personal` - Personal tasks
- Custom lists created as needed

### Task Views

| Endpoint | Description |
|----------|-------------|
| `GET /tasks` | All tasks with filters |
| `GET /tasks/today` | Tasks due today |
| `GET /tasks/overdue` | Overdue tasks |
| `GET /tasks/lists` | Available lists |

### Completing Tasks

```bash
POST /api/v1/tasks/{id}/complete
```

---

## Reminder System

Set reminders with flexible scheduling and multiple notification channels.

### Creating Reminders

**Via API:**
```bash
POST /api/v1/reminders
{
  "title": "Call dentist",
  "description": "Schedule annual checkup",
  "remind_at": "2025-12-05T09:00:00Z",
  "priority": "medium",
  "category": "health",
  "notification_channels": ["in_app", "email"]
}
```

### Reminder Actions

| Action | Endpoint | Description |
|--------|----------|-------------|
| Complete | `POST /reminders/{id}/complete` | Mark as done |
| Snooze | `POST /reminders/{id}/snooze` | Delay reminder |
| Cancel | `POST /reminders/{id}/cancel` | Cancel reminder |

### Notification Channels

- `in_app` - In-application notifications
- `email` - Email notifications (requires SendGrid setup)
- `sms` - SMS notifications (requires Twilio setup)
- `slack` - Slack notifications (requires Slack setup)

### Recurring Reminders

Use RRule format for complex recurrence:
```bash
{
  "is_recurring": true,
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR"
}
```

---

## Integrations (Notion & Trello)

Sync tasks from external productivity tools.

### Notion Integration

**Setup:**
1. Go to Integrations page (`/integrations`)
2. Click "Connect" on Notion card
3. Enter your Notion Integration Token
4. Click "Connect"

**Getting Your Notion Token:**
1. Visit [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the "Internal Integration Token"
4. Share your databases with the integration

**What Syncs:**
- Database items as tasks
- Due dates
- Priority (from select/status properties)
- Descriptions (from rich text properties)

**Sync Command:**
```bash
POST /api/v1/integrations/notion/sync
```

### Trello Integration

**Setup:**
1. Go to Integrations page (`/integrations`)
2. Click "Connect" on Trello card
3. Enter API Key and Token
4. Click "Connect"

**Getting Trello Credentials:**
1. Visit [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Get your API Key
3. Generate a Token using the API Key

**What Syncs:**
- Cards as tasks
- Due dates
- Labels as priority indicators
- Card descriptions
- Board name as category

**Sync Command:**
```bash
POST /api/v1/integrations/trello/sync
```

### Integration Management

| Action | Endpoint |
|--------|----------|
| List all | `GET /integrations` |
| Get details | `GET /integrations/{type}` |
| Toggle on/off | `PATCH /integrations/{type}/toggle` |
| Remove | `DELETE /integrations/{type}` |

---

## API Reference

### Authentication

All API endpoints (except `/auth/*`) require authentication:

```bash
Authorization: Bearer <your-jwt-token>
```

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints Summary

| Resource | Endpoints |
|----------|-----------|
| Auth | `/auth/login`, `/auth/signup`, `/auth/me`, `/auth/refresh` |
| Onboarding | `/onboarding`, `/onboarding/step/:step`, `/onboarding/complete` |
| Memories | `/memories`, `/memories/remember`, `/memories/search`, `/memories/relevant` |
| Tasks | `/tasks`, `/tasks/today`, `/tasks/overdue`, `/tasks/lists` |
| Reminders | `/reminders`, `/reminders/upcoming`, `/reminders/due` |
| Workflows | `/workflows/today`, `/workflows/morning`, `/workflows/midday`, `/workflows/evening` |
| Integrations | `/integrations`, `/integrations/notion`, `/integrations/trello` |

### Response Format

All responses follow this structure:

```json
{
  "data": { ... },
  "message": "Success message",
  "count": 10  // for list endpoints
}
```

### Error Responses

```json
{
  "error": "Error message",
  "details": { ... }  // optional
}
```

---

## Environment Variables

Key environment variables for configuration:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/cxo_assistant

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# Integrations (optional)
SENDGRID_API_KEY=your-sendgrid-key
SLACK_BOT_TOKEN=your-slack-token

# AI (for future features)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
docker-compose restart postgres
```

**Redis Connection Failed**
```bash
docker-compose restart redis
```

**Integration Sync Fails**
- Verify API keys are correct
- Check integration validation status
- Review sync error in integration details

**Briefings Not Generating**
- Ensure onboarding is completed
- Check that tasks/events exist for the day
- Verify user timezone settings

---

## What's Next

Future enhancements planned:
- Voice interface for commands
- Habit tracking with streak counters
- Advanced AI-powered insights
- Mobile app (React Native)
- Multi-user collaboration
- Microsoft/Apple calendar sync

---

*Last updated: December 2025*
