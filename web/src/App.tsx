import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Home } from './pages/Home'
import { TeamSelector } from './pages/TeamSelector'
import { Standings } from './pages/Standings'
import { Schedule } from './pages/Schedule'
import { Leaderboard } from './pages/Leaderboard'
import { TeamDetail } from './pages/TeamDetail'
import { GameDetail } from './pages/GameDetail'
import { getDarkMode } from './lib/storage'
import { supabase } from './lib/supabase'

function LiveGameToast({ game, onClose }: { game: { home_team_name: string; away_team_name: string }; onClose: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full px-4 animate-slide-down">
      <div className="card p-4 shadow-lg border-l-4 border-green-500">
        <div className="flex items-start gap-3">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-black dark:text-white">
              {game.home_team_name} vs {game.away_team_name} is live!
            </div>
            <button
              onClick={() => {
                navigate('/schedule')
                onClose()
              }}
              className="text-sm text-tamkeen-primary font-medium mt-1"
            >
              View in Schedule
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const location = useLocation()
  const [liveToast, setLiveToast] = useState<{ home_team_name: string; away_team_name: string } | null>(null)

  useEffect(() => {
    // Initialize dark mode
    if (getDarkMode()) {
      document.documentElement.classList.add('dark')
    }

    // Listen for games going live
    const channel = supabase
      .channel('game-live-notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games' },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown> | null
          if (newRecord && newRecord.status === 'live') {
            setLiveToast({
              home_team_name: newRecord.home_team_name as string,
              away_team_name: newRecord.away_team_name as string
            })
            // Auto-dismiss after 8 seconds
            setTimeout(() => setLiveToast(null), 8000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <>
    {liveToast && <LiveGameToast game={liveToast} onClose={() => setLiveToast(null)} />}
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/select-team" element={<TeamSelector />} />
      <Route path="/standings" element={<Standings />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/team/:teamName" element={<TeamDetail />} />
      <Route path="/game/:gameId" element={<GameDetail />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default App
