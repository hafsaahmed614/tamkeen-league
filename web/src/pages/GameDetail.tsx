import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/Loading'
import { ErrorState } from '../components/ErrorState'
import { ShareButton } from '../components/ShareButton'
import { useGameWithScores } from '../hooks/useGames'
import { formatFullDate, formatGameTime } from '../lib/supabase'
import { shareGameResult } from '../lib/share'
import type { ScoreLog } from '../types'

// Get up to 2 initials from a team name (e.g., "Hijabi Hoopers" → "HH", "Team 3" → "T3")
function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>()
  const { game, scoreLogs, loading, error, refetch } = useGameWithScores(
    gameId ? parseInt(gameId) : null
  )

  if (loading) {
    return (
      <Layout>
        <Header title="Game" showBack />
        <LoadingSpinner />
      </Layout>
    )
  }

  if (error || !game) {
    return (
      <Layout>
        <Header title="Game" showBack />
        <ErrorState message={error || 'Game not found'} onRetry={refetch} />
      </Layout>
    )
  }

  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'

  // Group score logs by player for stats
  const playerStats = scoreLogs.reduce((acc, log) => {
    const key = `${log.player_name}-${log.team_name}`
    if (!acc[key]) {
      acc[key] = { player_name: log.player_name, team_name: log.team_name, points: 0 }
    }
    acc[key].points += log.points
    return acc
  }, {} as Record<string, { player_name: string; team_name: string; points: number }>)

  const homePlayerStats = Object.values(playerStats)
    .filter(p => p.team_name === game.home_team_name)
    .sort((a, b) => b.points - a.points)

  const awayPlayerStats = Object.values(playerStats)
    .filter(p => p.team_name === game.away_team_name)
    .sort((a, b) => b.points - a.points)

  return (
    <Layout>
      <Header
        title={isLive ? 'Live Game' : isFinal ? 'Final Score' : 'Upcoming Game'}
        showBack
        rightAction={
          (isLive || isFinal) && (
            <ShareButton
              onShare={() => shareGameResult(
                game.home_team_name,
                game.away_team_name,
                game.home_score,
                game.away_score,
                game.status as 'live' | 'final'
              )}
            />
          )
        }
      />

      {/* Game header / Scoreboard */}
      <div className={`p-6 ${isLive ? 'bg-green-600' : isFinal ? 'bg-gray-800' : 'bg-tamkeen-primary'} text-white`}>
        {/* Status badge */}
        <div className="flex justify-center mb-4">
          {isLive && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {isFinal && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {game.home_score === game.away_score ? 'FINAL - TIE' : 'FINAL'}
            </span>
          )}
          {!isLive && !isFinal && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              UPCOMING
            </span>
          )}
        </div>

        {/* Score display */}
        <div className="flex items-center justify-center gap-4">
          {/* Home team */}
          <div className="flex-1 text-center">
            <Link to={`/team/${encodeURIComponent(game.home_team_name)}`}>
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">{getTeamInitials(game.home_team_name)}</span>
              </div>
              <div className="font-medium truncate">{game.home_team_name}</div>
            </Link>
            {(isLive || isFinal) && (
              <div className={`text-4xl font-bold mt-2 ${game.home_score > game.away_score ? 'text-yellow-300' : ''}`}>
                {game.home_score}
              </div>
            )}
          </div>

          {/* VS / Score separator */}
          <div className="text-2xl font-light opacity-60">
            {isLive || isFinal ? '-' : 'vs'}
          </div>

          {/* Away team */}
          <div className="flex-1 text-center">
            <Link to={`/team/${encodeURIComponent(game.away_team_name)}`}>
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">{getTeamInitials(game.away_team_name)}</span>
              </div>
              <div className="font-medium truncate">{game.away_team_name}</div>
            </Link>
            {(isLive || isFinal) && (
              <div className={`text-4xl font-bold mt-2 ${game.away_score > game.home_score ? 'text-yellow-300' : ''}`}>
                {game.away_score}
              </div>
            )}
          </div>
        </div>

        {/* Game info */}
        <div className="mt-6 text-center text-sm text-white/80">
          <div>{formatFullDate(game.start_time)} • {formatGameTime(game.start_time)}</div>
          <div className="mt-1">{game.location}</div>
        </div>
      </div>

      {/* Player stats (only for live/final games) */}
      {(isLive || isFinal) && (homePlayerStats.length > 0 || awayPlayerStats.length > 0) && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Player Stats</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Home team stats */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">{game.home_team_name}</div>
              <div className="card overflow-hidden">
                {homePlayerStats.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">No points yet</div>
                ) : (
                  homePlayerStats.map((player, i) => (
                    <div
                      key={player.player_name}
                      className={`flex justify-between items-center p-3 ${
                        i < homePlayerStats.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                      }`}
                    >
                      <span className="text-sm truncate">{player.player_name}</span>
                      <span className="font-bold">{player.points}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Away team stats */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">{game.away_team_name}</div>
              <div className="card overflow-hidden">
                {awayPlayerStats.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">No points yet</div>
                ) : (
                  awayPlayerStats.map((player, i) => (
                    <div
                      key={player.player_name}
                      className={`flex justify-between items-center p-3 ${
                        i < awayPlayerStats.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                      }`}
                    >
                      <span className="text-sm truncate">{player.player_name}</span>
                      <span className="font-bold">{player.points}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live scoring feed */}
      {isLive && scoreLogs.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Live Feed</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {scoreLogs.slice(0, 20).map((log: ScoreLog) => (
              <div
                key={log.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  log.team_name === game.home_team_name
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'bg-orange-50 dark:bg-orange-900/20'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  log.points === 3 ? 'bg-purple-500 text-white' :
                  log.points === 2 ? 'bg-green-500 text-white' :
                  'bg-gray-400 text-white'
                }`}>
                  +{log.points}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{log.player_name}</div>
                  <div className="text-xs text-gray-500">{log.team_name}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
