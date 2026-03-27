import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { Header } from '../components/Header'
import { GameCard } from '../components/GameCard'
import { LoadingSpinner, GameCardSkeleton } from '../components/Loading'
import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { useTeam } from '../hooks/useTeams'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useStandings } from '../hooks/useStandings'
import { supabase } from '../lib/supabase'
import type { ScoreLog } from '../types'

// Get up to 2 initials from a team name (e.g., "Hijabi Hoopers" → "HH", "Team 3" → "T3")
function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

type Tab = 'roster' | 'games'

export function TeamDetail() {
  const { teamName } = useParams<{ teamName: string }>()
  const decodedTeamName = teamName ? decodeURIComponent(teamName) : ''

  const { team, loading: teamLoading, error: teamError } = useTeam(decodedTeamName)
  const { players, loading: playersLoading, error: playersError, refetch: refetchPlayers } = usePlayers(decodedTeamName)
  const { games, loading: gamesLoading, error: gamesError, refetch: refetchGames } = useGames(decodedTeamName)
  const { standings } = useStandings()

  const [tab, setTab] = useState<Tab>('roster')
  const [gameScores, setGameScores] = useState<Record<number, { home: number; away: number }>>({})

  const teamStanding = standings.find(s => s.name === decodedTeamName)

  // Fetch scores for games
  useEffect(() => {
    const fetchScores = async () => {
      const gamesWithScores = games.filter(g => g.status !== 'scheduled')
      if (gamesWithScores.length === 0) return

      const { data } = await supabase
        .from('score_logs')
        .select('*')
        .in('game_id', gamesWithScores.map(g => g.id))

      if (data) {
        const scores: Record<number, { home: number; away: number }> = {}
        for (const game of gamesWithScores) {
          const gameLogs = data.filter((l: ScoreLog) => l.game_id === game.id)
          scores[game.id] = {
            home: gameLogs.filter((l: ScoreLog) => l.team_name === game.home_team_name).reduce((s: number, l: ScoreLog) => s + l.points, 0),
            away: gameLogs.filter((l: ScoreLog) => l.team_name === game.away_team_name).reduce((s: number, l: ScoreLog) => s + l.points, 0)
          }
        }
        setGameScores(scores)
      }
    }

    fetchScores()
  }, [games])

  const loading = teamLoading || playersLoading || gamesLoading
  const error = teamError || playersError || gamesError

  if (error) {
    return (
      <Layout>
        <Header title={decodedTeamName || 'Team'} showBack />
        <ErrorState message={error} onRetry={() => { refetchPlayers(); refetchGames() }} />
      </Layout>
    )
  }

  return (
    <Layout>
      <Header title={decodedTeamName} showBack />

      {/* Team header */}
      <div className="bg-tamkeen-primary text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold">{getTeamInitials(decodedTeamName)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{decodedTeamName}</h1>
            {team && (
              <div className="flex gap-4 mt-1 text-white/80">
                <span>Record: <span className="font-semibold text-white">{team.wins}-{team.losses}-{team.ties}</span></span>
                {teamStanding && (
                  <span>Rank: <span className="font-semibold text-white">#{teamStanding.rank}</span></span>
                )}
              </div>
            )}
          </div>
        </div>

        {teamStanding && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{teamStanding.points_for}</div>
              <div className="text-xs text-white/70">Points For</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{teamStanding.points_against}</div>
              <div className="text-xs text-white/70">Points Against</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${teamStanding.point_diff >= 0 ? '' : 'text-red-300'}`}>
                {teamStanding.point_diff > 0 ? '+' : ''}{teamStanding.point_diff}
              </div>
              <div className="text-xs text-white/70">Differential</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('roster')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'roster'
              ? 'border-tamkeen-primary text-tamkeen-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Roster ({players.length})
        </button>
        <button
          onClick={() => setTab('games')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'games'
              ? 'border-tamkeen-primary text-tamkeen-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Games ({games.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === 'roster' ? (
          loading ? (
            <LoadingSpinner />
          ) : players.length === 0 ? (
            <EmptyState
              title="No players"
              description="This team doesn't have any players yet"
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
          ) : (
            <div className="card overflow-hidden">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 ${
                    index < players.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tamkeen-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-tamkeen-primary font-bold">#{player.jersey_number}</span>
                    </div>
                    <span className="font-medium">{player.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Games tab
          loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          ) : games.length === 0 ? (
            <EmptyState
              title="No games"
              description="This team doesn't have any games scheduled"
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-3">
              {games.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  homeScore={gameScores[game.id]?.home || 0}
                  awayScore={gameScores[game.id]?.away || 0}
                />
              ))}
            </div>
          )
        )}
      </div>
    </Layout>
  )
}
