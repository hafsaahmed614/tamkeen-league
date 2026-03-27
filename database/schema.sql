-- Tamkeen Sports League Database Schema
-- Run this in Supabase SQL Editor to set up your database
-- NOTE: This schema uses names instead of IDs for easier readability

-- ============================================
-- Table 1: teams
-- General team metadata
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table 2: players
-- Roster information (uses team_name instead of team_id)
-- ============================================
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    team_name TEXT NOT NULL,
    name TEXT NOT NULL,
    jersey_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_name, jersey_number)
);

-- ============================================
-- Table 3: games
-- Schedule and game metadata (uses team names instead of IDs)
-- ============================================
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    home_team_name TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'final')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_teams CHECK (home_team_name != away_team_name)
);

-- ============================================
-- Table 4: score_logs (The Ledger)
-- Every point scored is recorded here (uses names instead of IDs)
-- ============================================
CREATE TABLE IF NOT EXISTS score_logs (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    team_name TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points IN (1, 2, 3)),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_players_team_name ON players(team_name);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_start_time ON games(start_time);
CREATE INDEX IF NOT EXISTS idx_games_home_team ON games(home_team_name);
CREATE INDEX IF NOT EXISTS idx_games_away_team ON games(away_team_name);
CREATE INDEX IF NOT EXISTS idx_score_logs_game_id ON score_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_score_logs_player_name ON score_logs(player_name);
CREATE INDEX IF NOT EXISTS idx_score_logs_team_name ON score_logs(team_name);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: Public read access
-- ============================================
CREATE POLICY "Public read access for teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Public read access for players" ON players
    FOR SELECT USING (true);

CREATE POLICY "Public read access for games" ON games
    FOR SELECT USING (true);

CREATE POLICY "Public read access for score_logs" ON score_logs
    FOR SELECT USING (true);

-- ============================================
-- RLS Policies: Authenticated users can write
-- (For admin access via service role key, RLS is bypassed)
-- ============================================
CREATE POLICY "Authenticated insert for teams" ON teams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update for teams" ON teams
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete for teams" ON teams
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert for players" ON players
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update for players" ON players
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete for players" ON players
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert for games" ON games
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update for games" ON games
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete for games" ON games
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert for score_logs" ON score_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete for score_logs" ON score_logs
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- Enable Realtime for live scoring
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE score_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
