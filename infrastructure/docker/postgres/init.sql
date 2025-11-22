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

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cxo_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cxo_user;
