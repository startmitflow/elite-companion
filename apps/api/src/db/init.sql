-- Elite Dangerous Companion Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  commander_name VARCHAR(100),
  api_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth connections
CREATE TABLE IF NOT EXISTS oauth_accounts (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  PRIMARY KEY (user_id, provider)
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'dark',
  edsm_api_key VARCHAR(100),
  inara_api_key VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ships/Loadouts
CREATE TABLE IF NOT EXISTS ships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  ship_type VARCHAR(50) NOT NULL,
  loadout JSONB NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('encoded', 'manufactured', 'raw')),
  rarity INTEGER NOT NULL CHECK (rarity BETWEEN 1 AND 5),
  description TEXT
);

-- User inventory
CREATE TABLE IF NOT EXISTS user_inventory (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES materials(id),
  count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, material_id)
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mission_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  mission_type VARCHAR(50),
  target_system VARCHAR(100),
  target_station VARCHAR(100),
  reward INTEGER,
  expiry TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market prices (for trading)
CREATE TABLE IF NOT EXISTS market_prices (
  id SERIAL PRIMARY KEY,
  system_name VARCHAR(100) NOT NULL,
  station_name VARCHAR(100) NOT NULL,
  commodity_name VARCHAR(100) NOT NULL,
  buy_price INTEGER,
  sell_price INTEGER,
  demand INTEGER,
  supply INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colonisation projects
CREATE TABLE IF NOT EXISTS colonisation_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  system_name VARCHAR(100) NOT NULL,
  project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('outpost', 'hub', 'station', 'megaship')),
  economy_type VARCHAR(50) NOT NULL CHECK (economy_type IN ('industrial', 'refinery', 'agriculture', 'military', 'tourism', 'hightech', 'extraction')),
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'abandoned')),
  progress_percent INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System resources
CREATE TABLE IF NOT EXISTS system_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_name VARCHAR(100) NOT NULL,
  body_name VARCHAR(200) NOT NULL,
  body_type VARCHAR(50),
  resources JSONB,
  atmosphere_type VARCHAR(50),
  terraform_state VARCHAR(50),
  landable BOOLEAN,
  recommended_economy VARCHAR(50),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Construction requirements
CREATE TABLE IF NOT EXISTS construction_requirements (
  project_id UUID REFERENCES colonisation_projects(id) ON DELETE CASCADE,
  material_name VARCHAR(100) NOT NULL,
  required INTEGER NOT NULL,
  delivered INTEGER DEFAULT 0,
  PRIMARY KEY (project_id, material_name)
);

-- Exploration stats
CREATE TABLE IF NOT EXISTS exploration_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  systems_visited INTEGER DEFAULT 0,
  first_discoveries INTEGER DEFAULT 0,
  total_distance_ly FLOAT DEFAULT 0,
  estimated_credits INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discoveries
CREATE TABLE IF NOT EXISTS discoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  system_name VARCHAR(100) NOT NULL,
  body_name VARCHAR(200) NOT NULL,
  body_type VARCHAR(50),
  is_first_discovery BOOLEAN DEFAULT FALSE,
  scan_type VARCHAR(20),
  estimated_value INTEGER,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal events (for processing)
CREATE TABLE IF NOT EXISTS journal_events (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ships_user ON ships(user_id);
CREATE INDEX idx_inventory_user ON user_inventory(user_id);
CREATE INDEX idx_missions_user ON missions(user_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_colonisation_user ON colonisation_projects(user_id);
CREATE INDEX idx_system_resources_system ON system_resources(system_name);
CREATE INDEX idx_discoveries_user ON discoveries(user_id);
CREATE INDEX idx_journal_user ON journal_events(user_id);