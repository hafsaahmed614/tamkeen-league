import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Layout } from '../components/Layout'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/Loading'
import { useStandings } from '../hooks/useStandings'

export function Home() {
  const navigate = useNavigate()
  const { standings, loading: standingsLoading } = useStandings()

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

  return (
    <Layout>
      <Header title="Tamkeen League" />

      <div className="flex flex-col items-center p-6">
        {/* Logo and branding */}
        <img
          src="https://tamkeensports.org/wp-content/uploads/2025/07/Maroon-transparent-logo-scaled-100x100.png"
          alt="Tamkeen League"
          className="w-24 h-24 mb-6 mt-8"
        />
        <h1 className="text-2xl font-bold font-heading text-tamkeen-primary mb-2">
          Tamkeen League
        </h1>
        <p className="text-black/60 dark:text-white/60 text-center font-body mb-8">
          Search for a team to view their details
        </p>

        {/* Searchable team dropdown */}
        <div className="w-full max-w-md">
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
        </div>
      </div>
    </Layout>
  )
}
