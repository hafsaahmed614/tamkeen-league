import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Layout } from '../components/Layout'
import { Header } from '../components/Header'
import { GameCard } from '../components/GameCard'
import { LoadingSpinner, GameCardSkeleton } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { useTeam } from '../hooks/useTeams'
import { useLiveGames, useGames } from '../hooks/useGames'
import { useStandings } from '../hooks/useStandings'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { getSelectedTeam } from '../lib/storage'
import { supabase } from '../lib/supabase'
import type { ScoreLog } from '../types'

export function Home() {
  const navigate = useNavigate()
  const selectedTeamName = getSelectedTeam()
  const { team } = useTeam(selectedTeamName)
  const { games: liveGames } = useLiveGames()
  const { games: upcomingGames, loading: upcomingLoading } = useGames(selectedTeamName, 'scheduled')
  const { standings, loading: standingsLoading } = useStandings()
  const { players: topPlayers, loading: playersLoading } = useLeaderboard(3)

  // Team search dropdown state
  const [teamSearch, setTeamSearch] = useState('')
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredStandings = standings.filter(t =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  )

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTeamDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scores for live games
  const [gameScores, setGameScores] = useState<Record<number, { home: number; away: number }>>({})

  useEffect(() => {
    const fetchScores = async () => {
      if (liveGames.length === 0) return

      const { data } = await supabase
        .from('score_logs')
        .select('*')
        .in('game_id', liveGames.map(g => g.id))

      if (data) {
        const scores: Record<number, { home: number; away: number }> = {}
        for (const game of liveGames) {
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
  }, [liveGames])

  const myTeamLiveGames = selectedTeamName
    ? liveGames.filter(g => g.home_team_name === selectedTeamName || g.away_team_name === selectedTeamName)
    : liveGames

  const nextGame = upcomingGames[0]
  const myTeamStanding = standings.find(s => s.name === selectedTeamName)

  return (
    <Layout>
      <Header title="Tamkeen League" />

      <div className="p-4 space-y-6">
        {/* Team Stats Card (if team selected) */}
        {selectedTeamName && myTeamStanding && (
          <Link to={`/team/${encodeURIComponent(selectedTeamName)}`} className="block">
            <div className="card p-4 bg-tamkeen-primary text-white">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm opacity-80">Your Team</span>
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                  #{myTeamStanding.rank}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">{selectedTeamName}</div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="opacity-80">Record:</span>{' '}
                  <span className="font-semibold">{team?.wins}-{team?.losses}-{team?.ties}</span>
                </div>
                <div>
                  <span className="opacity-80">Diff:</span>{' '}
                  <span className="font-semibold">
                    {myTeamStanding.point_diff > 0 ? '+' : ''}{myTeamStanding.point_diff}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Live Games */}
        {myTeamLiveGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Now
            </h2>
            <div className="space-y-3">
              {myTeamLiveGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  homeScore={gameScores[game.id]?.home || 0}
                  awayScore={gameScores[game.id]?.away || 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Next Game */}
        {nextGame && (
          <section>
            <h2 className="text-lg font-semibold mb-3">
              {selectedTeamName ? 'Next Game' : 'Upcoming'}
            </h2>
            {upcomingLoading ? (
              <GameCardSkeleton />
            ) : (
              <GameCard game={nextGame} />
            )}
          </section>
        )}

        {/* Team Search & Standings */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Teams</h2>
            <Link to="/standings" className="text-sm text-tamkeen-primary font-medium">
              Full Standings
            </Link>
          </div>
          {standingsLoading ? (
            <div className="card p-4">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <div className="card overflow-hidden">
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={teamSearch}
                    onChange={(e) => {
                      setTeamSearch(e.target.value)
                      setTeamDropdownOpen(true)
                    }}
                    onFocus={() => setTeamDropdownOpen(true)}
                    className="w-full pl-9 pr-4 py-3 bg-transparent text-sm focus:outline-none text-black dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>
              {teamDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full card overflow-hidden shadow-lg max-h-64 overflow-y-auto">
                  {filteredStandings.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">No teams found</div>
                  ) : (
                    filteredStandings.map((team, index) => (
                      <button
                        key={team.id}
                        onClick={() => {
                          setTeamDropdownOpen(false)
                          setTeamSearch('')
                          navigate(`/team/${encodeURIComponent(team.name)}`)
                        }}
                        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left ${
                          index < filteredStandings.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-medium text-gray-500 text-sm">
                            {team.rank}
                          </span>
                          <span className="font-medium">
                            {team.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {team.wins}-{team.losses}-{team.ties}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Top Scorers */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Top Scorers</h2>
            <Link to="/leaderboard" className="text-sm text-tamkeen-primary font-medium">
              See All
            </Link>
          </div>
          {playersLoading ? (
            <div className="card p-4">
              <LoadingSpinner />
            </div>
          ) : topPlayers.length > 0 ? (
            <div className="card overflow-hidden">
              {topPlayers.map((player, index) => (
                <div
                  key={player.player_name}
                  className={`flex items-center justify-between p-3 ${
                    index < 2 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-tamkeen-primary/10 text-tamkeen-primary text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{player.player_name}</div>
                      <div className="text-xs text-gray-500">{player.team_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{player.total_points}</div>
                    <div className="text-xs text-gray-500">{player.ppg.toFixed(1)} PPG</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No stats yet" description="Player stats will appear after games are played" />
          )}
        </section>
      </div>
    </Layout>
  )
}
