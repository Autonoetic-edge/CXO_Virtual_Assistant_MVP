-- CXO Virtual Assistant - MVP Features Migration
-- Version: 2.0
-- Adds: Onboarding, Personal Memories, Reminders, Tasks, Integration Keys

-- User onboarding data table (gamified onboarding form data)
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Daily routine
  wake_up_time TIME DEFAULT '07:00',
  sleep_time TIME DEFAULT '23:00',
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '18:00',
  break_schedule JSONB DEFAULT '{"morning": "10:30", "lunch": "13:00", "evening": "16:00"}',

  -- Habit tracking preferences
  habits_to_track JSONB DEFAULT '[]',
  habit_reminder_frequency VARCHAR(50) DEFAULT 'daily',

  -- Important dates
  important_dates JSONB DEFAULT '[]', -- [{type: 'birthday', name: 'Mom', date: '1960-05-15'}, ...]

  -- Personal preferences
  communication_tone VARCHAR(50) DEFAULT 'professional', -- casual, professional, friendly, formal
  productivity_style VARCHAR(50) DEFAULT 'balanced', -- focused, balanced, flexible
  preferred_briefing_detail VARCHAR(50) DEFAULT 'detailed', -- brief, detailed, comprehensive
  motivation_style VARCHAR(50) DEFAULT 'encouraging', -- direct, encouraging, data-driven

  -- Completion status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INT DEFAULT 0,
  onboarding_completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);

-- Personal memories table (Knowledge Graph for personal data)
CREATE TABLE IF NOT EXISTS personal_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Memory content
  memory_type VARCHAR(100) NOT NULL, -- birthday, anniversary, preference, note, person, event, fact
  title VARCHAR(500) NOT NULL,
  content TEXT,

  -- Structured data for different memory types
  metadata JSONB DEFAULT '{}',

  -- Relationships (for KG)
  related_entities JSONB DEFAULT '[]', -- [{entity_type: 'person', entity_id: 'uuid', relation: 'spouse'}]
  tags JSONB DEFAULT '[]',

  -- Source tracking
  source VARCHAR(100) DEFAULT 'user', -- user, inferred, integration
  confidence_score FLOAT DEFAULT 1.0,

  -- Reminder integration
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_date DATE,
  reminder_recurrence VARCHAR(100), -- yearly, monthly, weekly, once

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_accessed_at TIMESTAMP,
  access_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personal_memories_user_id ON personal_memories(user_id);
CREATE INDEX idx_personal_memories_type ON personal_memories(memory_type);
CREATE INDEX idx_personal_memories_reminder_date ON personal_memories(reminder_date);
CREATE INDEX idx_personal_memories_tags ON personal_memories USING GIN(tags);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reminder content
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Timing
  remind_at TIMESTAMP NOT NULL,
  remind_before_minutes INT DEFAULT 0,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(500), -- RRule format
  next_occurrence TIMESTAMP,

  -- Priority and categorization
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  category VARCHAR(100), -- work, personal, health, finance, etc.

  -- Notification settings
  notification_channels JSONB DEFAULT '["in_app"]', -- in_app, email, sms, slack

  -- Related entities
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  related_memory_id UUID REFERENCES personal_memories(id) ON DELETE SET NULL,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'active', -- active, snoozed, completed, cancelled
  snoozed_until TIMESTAMP,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX idx_reminders_status ON reminders(status);

-- Tasks/To-do list table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Task content
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Organization
  list_name VARCHAR(100) DEFAULT 'default',
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  position INT DEFAULT 0,

  -- Priority and timing
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  due_date DATE,
  due_time TIME,
  estimated_duration_minutes INT,

  -- Categorization
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  progress_percentage INT DEFAULT 0,
  completed_at TIMESTAMP,

  -- External integration
  external_source VARCHAR(100), -- notion, trello, google_tasks
  external_id VARCHAR(500),
  external_url VARCHAR(1000),
  last_synced_at TIMESTAMP,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_list_name ON tasks(list_name);
CREATE INDEX idx_tasks_external_source ON tasks(external_source, external_id);

-- User integration keys table (secure storage for user-provided API keys)
CREATE TABLE IF NOT EXISTS user_integration_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Integration identification
  integration_type VARCHAR(100) NOT NULL, -- notion, trello, email, google_calendar

  -- Encrypted credentials
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,

  -- OAuth details
  oauth_provider VARCHAR(100),
  oauth_account_id VARCHAR(500),
  oauth_account_email VARCHAR(255),
  token_expires_at TIMESTAMP,

  -- Configuration
  config JSONB DEFAULT '{}',
  workspace_id VARCHAR(500),
  workspace_name VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMP,
  validation_status VARCHAR(50) DEFAULT 'pending', -- pending, valid, invalid, expired

  -- Sync tracking
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'never', -- never, syncing, success, failed
  sync_error VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, integration_type)
);

CREATE INDEX idx_user_integration_keys_user_id ON user_integration_keys(user_id);
CREATE INDEX idx_user_integration_keys_type ON user_integration_keys(integration_type);

-- Daily workflow tracking table
CREATE TABLE IF NOT EXISTS daily_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Date and workflow type
  workflow_date DATE NOT NULL,
  workflow_type VARCHAR(50) NOT NULL, -- morning, midday, evening, weekly

  -- Content
  content JSONB NOT NULL, -- Structured workflow content

  -- Delivery
  delivered_at TIMESTAMP,
  delivery_channel VARCHAR(50), -- in_app, email, slack, sms

  -- User interaction
  viewed_at TIMESTAMP,
  interaction_data JSONB DEFAULT '{}',

  -- AI generation metadata
  ai_model_used VARCHAR(100),
  generation_prompt_tokens INT,
  generation_completion_tokens INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, workflow_date, workflow_type)
);

CREATE INDEX idx_daily_workflows_user_date ON daily_workflows(user_id, workflow_date);
CREATE INDEX idx_daily_workflows_type ON daily_workflows(workflow_type);

-- Trigger for updated_at on new tables
CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON user_onboarding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_memories_updated_at BEFORE UPDATE ON personal_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_integration_keys_updated_at BEFORE UPDATE ON user_integration_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_workflows_updated_at BEFORE UPDATE ON daily_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default onboarding record for demo user
INSERT INTO user_onboarding (user_id, onboarding_completed, onboarding_step)
VALUES ('00000000-0000-0000-0000-000000000001', false, 0)
ON CONFLICT (user_id) DO NOTHING;
