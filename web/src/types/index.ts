// Database types matching Supabase schema

export interface Team {
  id: number
  name: string
  wins: number
  losses: number
  ties: number
  created_at: string
}

export interface Player {
  id: number
  team_name: string
  name: string
  jersey_number: number
  created_at: string
}

export interface Game {
  id: number
  home_team_name: string
  away_team_name: string
  start_time: string
  location: string
  status: 'scheduled' | 'live' | 'final'
  created_at: string
}

export interface ScoreLog {
  id: number
  game_id: number
  player_name: string
  team_name: string
  points: 1 | 2 | 3
  created_at: string
}

// Computed types for display

export interface TeamStanding extends Team {
  rank: number
  points_for: number
  points_against: number
  point_diff: number
}

export interface PlayerStats {
  player_name: string
  team_name: string
  games_played: number
  total_points: number
  ppg: number
}

export interface GameWithScores extends Game {
  home_score: number
  away_score: number
}

// App state types

export interface UserPreferences {
  selectedTeam: string | null
  darkMode: boolean
}
