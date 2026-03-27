import { useNavigate } from 'react-router-dom'
import { useTeams } from '../hooks/useTeams'
import { setSelectedTeam } from '../lib/storage'
import { Layout } from '../components/Layout'
import { LoadingSpinner } from '../components/Loading'
import { ErrorState } from '../components/ErrorState'

// Get up to 2 initials from a team name (e.g., "Hijabi Hoopers" → "HH", "Team 3" → "T3")
function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function TeamSelector() {
  const navigate = useNavigate()
  const { teams, loading, error, refetch } = useTeams()

  const handleSelectTeam = (teamName: string) => {
    setSelectedTeam(teamName)
    navigate('/')
  }

  if (loading) {
    return (
      <Layout hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <LoadingSpinner />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <div className="min-h-screen flex flex-col p-6">
        {/* Logo area */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
          <img
            src="https://tamkeensports.org/wp-content/uploads/2025/07/Maroon-transparent-logo-scaled-100x100.png"
            alt="Tamkeen League"
            className="w-24 h-24 mb-6"
          />
          <h1 className="text-2xl font-bold font-heading text-tamkeen-primary mb-2">
            Tamkeen League
          </h1>
          <p className="text-black dark:text-white text-center font-body">
            Select Your Team
          </p>
        </div>

        {/* Team list */}
        <div className="space-y-3">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => handleSelectTeam(team.name)}
              className="w-full card p-4 flex items-center justify-between hover:shadow-md transition-shadow active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tamkeen-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getTeamInitials(team.name)}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-black dark:text-white">
                    {team.name}
                  </div>
                  <div className="text-sm text-black/60 dark:text-white/60">
                    {team.wins}-{team.losses}-{team.ties} Record
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* View all option */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setSelectedTeam(null)
              navigate('/')
            }}
            className="text-tamkeen-primary font-medium hover:underline"
          >
            View All Teams
          </button>
        </div>
      </div>
    </Layout>
  )
}
