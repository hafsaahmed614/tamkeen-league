import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Header } from '../components/Header'
import { GameCard, } from '../components/GameCard'
import { GameCardSkeleton } from '../components/Loading'
import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { useGames } from '../hooks/useGames'
import { getSelectedTeam } from '../lib/storage'
import { supabase } from '../lib/supabase'
import type { ScoreLog, Game } from '../types'

type FilterStatus = 'all' | 'scheduled' | 'live' | 'final'

export function Schedule() {
  const selectedTeamName = getSelectedTeam()
  const { games, loading, error, refetch } = useGames(selectedTeamName)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [gameScores, setGameScores] = useState<Record<number, { home: number; away: number }>>({})

  // Fetch scores for completed/live games
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

  const filteredGames = filter === 'all'
    ? games
    : games.filter(g => g.status === filter)

  // Group games by date
  const gamesByDate = filteredGames.reduce((acc, game) => {
    const date = new Date(game.start_time).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(game)
    return acc
  }, {} as Record<string, Game[]>)

  if (error) {
    return (
      <Layout>
        <Header title="Schedule" />
        <ErrorState message={error} onRetry={refetch} />
      </Layout>
    )
  }

  return (
    <Layout>
      <Header
        title={selectedTeamName ? `${selectedTeamName} Schedule` : 'Schedule'}
        rightAction={
          !selectedTeamName && (
            <Link
              to="/select-team"
              className="text-sm text-tamkeen-primary font-medium"
            >
              Filter By Team
            </Link>
          )
        }
      />

      {/* Filter tabs */}
      <div className="sticky top-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2">
          {(['all', 'live', 'scheduled', 'final'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-tamkeen-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {status === 'all' ? 'All Games' :
               status === 'live' ? 'Live' :
               status === 'scheduled' ? 'Upcoming' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'No games scheduled' : `No ${filter} games`}
          description={
            selectedTeamName
              ? `${selectedTeamName} has no ${filter === 'all' ? '' : filter + ' '}games`
              : 'Games will appear here once scheduled'
          }
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          action={
            selectedTeamName && (
              <Link to="/select-team" className="btn-secondary text-sm">
                Change Team
              </Link>
            )
          }
        />
      ) : (
        <div className="p-4 space-y-6">
          {Object.entries(gamesByDate).map(([date, dateGames]) => (
            <section key={date}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {date}
              </h3>
              <div className="space-y-3">
                {dateGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    homeScore={gameScores[game.id]?.home || 0}
                    awayScore={gameScores[game.id]?.away || 0}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Layout>
  )
}
