import { Link } from 'react-router-dom'
import { formatGameDate, formatGameTime } from '../lib/supabase'
import { shareGameResult } from '../lib/share'
import { ShareButton } from './ShareButton'
import type { Game } from '../types'

interface GameCardProps {
  game: Game
  homeScore?: number
  awayScore?: number
}

export function GameCard({ game, homeScore = 0, awayScore = 0 }: GameCardProps) {
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const showScores = isLive || isFinal

  return (
    <Link to={`/game/${game.id}`} className="block">
      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatGameDate(game.start_time)} • {formatGameTime(game.start_time)}
          </div>
          <div className="flex items-center gap-2">
            {isLive && <span className="status-live">LIVE</span>}
            {isFinal && <span className="status-final">FINAL</span>}
            {!isLive && !isFinal && <span className="status-scheduled">Upcoming</span>}

            {showScores && (
              <ShareButton
                size="sm"
                onShare={() =>
                  shareGameResult(
                    game.home_team_name,
                    game.away_team_name,
                    homeScore,
                    awayScore,
                    game.status as 'live' | 'final'
                  )
                }
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          {showScores && isFinal && homeScore === awayScore && (
            <div className="text-center text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">TIE</div>
          )}

          <div className="flex justify-between items-center">
            <span className={`font-medium ${showScores && homeScore > awayScore ? 'text-tamkeen-primary' : ''}`}>
              {game.home_team_name}
            </span>
            {showScores && (
              <span className={`text-xl font-bold ${homeScore > awayScore ? 'text-tamkeen-primary' : ''}`}>
                {homeScore}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className={`font-medium ${showScores && awayScore > homeScore ? 'text-tamkeen-primary' : ''}`}>
              {game.away_team_name}
            </span>
            {showScores && (
              <span className={`text-xl font-bold ${awayScore > homeScore ? 'text-tamkeen-primary' : ''}`}>
                {awayScore}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {game.location}
        </div>
      </div>
    </Link>
  )
}
