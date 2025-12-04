-- CXO Virtual Assistant Database Schema
-- Version: 1.0
-- Database: PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  work_hours_start TIME DEFAULT '09:00',
  work_hours_end TIME DEFAULT '19:00',
  primary_calendar_id VARCHAR(500),
  language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Calendars table
CREATE TABLE calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_calendar_id VARCHAR(500) NOT NULL,
  provider_access_token TEXT,
  provider_refresh_token TEXT,
  calendar_name VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_time TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, provider_calendar_id)
);

CREATE INDEX idx_calendars_user_id ON calendars(user_id);
CREATE INDEX idx_calendars_provider ON calendars(provider);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  provider_event_id VARCHAR(500) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(500),
  event_type VARCHAR(50),
  meeting_type VARCHAR(50),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_rule VARCHAR(500),
  attendees JSONB,
  attachments JSONB,
  preparation_required BOOLEAN DEFAULT FALSE,
  is_focus_block BOOLEAN DEFAULT FALSE,
  is_buffer_block BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_events_user_id_start_time ON events(user_id, start_time);
CREATE INDEX idx_events_provider_event_id ON events(provider_event_id);
CREATE INDEX idx_events_calendar_id ON events(calendar_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_is_deleted ON events(is_deleted);

-- Meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  meeting_title VARCHAR(500) NOT NULL,
  meeting_description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  meeting_type VARCHAR(50),
  is_recurring BOOLEAN DEFAULT FALSE,
  attendee_count INT,
  attendees JSONB,
  location VARCHAR(500),
  meeting_notes TEXT,
  preparation_notes TEXT,
  post_meeting_summary TEXT,
  action_items JSONB,
  decisions_made JSONB,
  status VARCHAR(50) DEFAULT 'scheduled',
  preparation_status VARCHAR(50) DEFAULT 'not_prepared',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_meetings_user_id_start_time ON meetings(user_id, start_time);
CREATE INDEX idx_meetings_event_id ON meetings(event_id);
CREATE INDEX idx_meetings_status ON meetings(status);

-- Meeting preparations table
CREATE TABLE meeting_preparations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preparation_package JSONB,
  relevant_documents JSONB,
  smart_insights JSONB,
  talking_points JSONB,
  potential_questions JSONB,
  meeting_context JSONB,
  preparation_completed_at TIMESTAMP,
  preparation_quality_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meeting_preparations_meeting_id ON meeting_preparations(meeting_id);
CREATE INDEX idx_meeting_preparations_user_id ON meeting_preparations(user_id);

-- Calendar patterns table
CREATE TABLE calendar_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50),
  pattern_name VARCHAR(255),
  pattern_rule JSONB,
  event_template JSONB,
  detection_confidence FLOAT,
  next_occurrence DATE,
  preparation_window INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_patterns_user_id ON calendar_patterns(user_id);
CREATE INDEX idx_calendar_patterns_type ON calendar_patterns(pattern_type);

-- Briefings table
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  briefing_type VARCHAR(50),
  briefing_date DATE,
  briefing_time TIME,
  content JSONB,
  delivery_channels JSONB,
  delivery_status VARCHAR(50) DEFAULT 'pending',
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  user_interactions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_briefings_user_id_date ON briefings(user_id, briefing_date);
CREATE INDEX idx_briefings_type ON briefings(briefing_type);
CREATE INDEX idx_briefings_status ON briefings(delivery_status);

-- Queries table
CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_text VARCHAR(2000) NOT NULL,
  query_type VARCHAR(100),
  interpreted_intent JSONB,
  response_text TEXT,
  response_type VARCHAR(50),
  execution_time_ms INT,
  success BOOLEAN DEFAULT TRUE,
  error_message VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_queries_user_id_created_at ON queries(user_id, created_at);
CREATE INDEX idx_queries_query_type ON queries(query_type);

-- Integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_type VARCHAR(50),
  provider VARCHAR(100),
  provider_account_id VARCHAR(500),
  provider_access_token TEXT,
  provider_refresh_token TEXT,
  config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced TIMESTAMP,
  error_count INT DEFAULT 0,
  last_error VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(integration_type);
CREATE INDEX idx_integrations_is_active ON integrations(is_active);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  language VARCHAR(10) DEFAULT 'en',
  work_hours_start TIME DEFAULT '09:00',
  work_hours_end TIME DEFAULT '19:00',
  focus_time_enabled BOOLEAN DEFAULT TRUE,
  focus_time_blocks JSONB,
  meeting_buffer_minutes INT DEFAULT 5,
  meeting_capacity_threshold FLOAT DEFAULT 0.7,
  briefing_preferences JSONB,
  notification_preferences JSONB,
  do_not_disturb_hours JSONB,
  timezone_awareness BOOLEAN DEFAULT TRUE,
  auto_resolve_conflicts BOOLEAN DEFAULT TRUE,
  preparation_style VARCHAR(50) DEFAULT 'detailed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendars_updated_at BEFORE UPDATE ON calendars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_preparations_updated_at BEFORE UPDATE ON meeting_preparations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_patterns_updated_at BEFORE UPDATE ON calendar_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefings_updated_at BEFORE UPDATE ON briefings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
-- Create a demo user
INSERT INTO users (id, email, first_name, last_name, role, timezone, language, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@cxoassistant.com', 'Demo', 'User', 'user', 'Asia/Kolkata', 'en', 'active');

-- Create default user preferences for demo user
INSERT INTO user_preferences (user_id, timezone, language, work_hours_start, work_hours_end, focus_time_enabled, meeting_buffer_minutes)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Asia/Kolkata', 'en', '09:00', '19:00', true, 10);

-- ========================================
-- MVP ADDITIONAL TABLES (Version 2.0)
-- ========================================

-- User onboarding data table (gamified onboarding form data)
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  wake_up_time TIME DEFAULT '07:00',
  sleep_time TIME DEFAULT '23:00',
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '18:00',
  break_schedule JSONB DEFAULT '{"morning": "10:30", "lunch": "13:00", "evening": "16:00"}',
  habits_to_track JSONB DEFAULT '[]',
  habit_reminder_frequency VARCHAR(50) DEFAULT 'daily',
  important_dates JSONB DEFAULT '[]',
  communication_tone VARCHAR(50) DEFAULT 'professional',
  productivity_style VARCHAR(50) DEFAULT 'balanced',
  preferred_briefing_detail VARCHAR(50) DEFAULT 'detailed',
  motivation_style VARCHAR(50) DEFAULT 'encouraging',
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
  memory_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  related_entities JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  source VARCHAR(100) DEFAULT 'user',
  confidence_score FLOAT DEFAULT 1.0,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_date DATE,
  reminder_recurrence VARCHAR(100),
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
  title VARCHAR(500) NOT NULL,
  description TEXT,
  remind_at TIMESTAMP NOT NULL,
  remind_before_minutes INT DEFAULT 0,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(500),
  next_occurrence TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(100),
  notification_channels JSONB DEFAULT '["in_app"]',
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  related_memory_id UUID REFERENCES personal_memories(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active',
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
  title VARCHAR(500) NOT NULL,
  description TEXT,
  list_name VARCHAR(100) DEFAULT 'default',
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  priority VARCHAR(20) DEFAULT 'medium',
  due_date DATE,
  due_time TIME,
  estimated_duration_minutes INT,
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'pending',
  progress_percentage INT DEFAULT 0,
  completed_at TIMESTAMP,
  external_source VARCHAR(100),
  external_id VARCHAR(500),
  external_url VARCHAR(1000),
  last_synced_at TIMESTAMP,
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
  integration_type VARCHAR(100) NOT NULL,
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  oauth_provider VARCHAR(100),
  oauth_account_id VARCHAR(500),
  oauth_account_email VARCHAR(255),
  token_expires_at TIMESTAMP,
  config JSONB DEFAULT '{}',
  workspace_id VARCHAR(500),
  workspace_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMP,
  validation_status VARCHAR(50) DEFAULT 'pending',
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'never',
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
  workflow_date DATE NOT NULL,
  workflow_type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  delivered_at TIMESTAMP,
  delivery_channel VARCHAR(50),
  viewed_at TIMESTAMP,
  interaction_data JSONB DEFAULT '{}',
  ai_model_used VARCHAR(100),
  generation_prompt_tokens INT,
  generation_completion_tokens INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, workflow_date, workflow_type)
);

CREATE INDEX idx_daily_workflows_user_date ON daily_workflows(user_id, workflow_date);
CREATE INDEX idx_daily_workflows_type ON daily_workflows(workflow_type);

-- Triggers for new tables
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

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cxo_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cxo_user;
