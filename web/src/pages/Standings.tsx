import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Header } from '../components/Header'
import { StandingsRowSkeleton } from '../components/Loading'
import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { ShareButton } from '../components/ShareButton'
import { useStandings } from '../hooks/useStandings'
import { shareStandings } from '../lib/share'
import { getSelectedTeam } from '../lib/storage'

export function Standings() {
  const { standings, loading, error, refetch } = useStandings()
  const selectedTeamName = getSelectedTeam()

  if (error) {
    return (
      <Layout>
        <Header title="Standings" />
        <ErrorState message={error} onRetry={refetch} />
      </Layout>
    )
  }

  return (
    <Layout>
      <Header
        title="Standings"
        rightAction={
          standings.length > 0 && (
            <ShareButton onShare={() => shareStandings(standings)} />
          )
        }
      />

      {loading ? (
        <div className="p-4">
          <div className="card overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <StandingsRowSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : standings.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Standings will appear once teams are added"
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      ) : (
        <div className="p-4">
          {/* Table Header */}
          <div className="card overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_repeat(4,minmax(0,1fr))] gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <span className="w-8">#</span>
              <span>Team</span>
              <span className="text-center">W-L-T</span>
              <span className="text-center">PF</span>
              <span className="text-center">PA</span>
              <span className="text-center">+/-</span>
            </div>

            {standings.map((team, index) => (
              <Link
                key={team.id}
                to={`/team/${team.name}`}
                className={`grid grid-cols-[auto_1fr_repeat(4,minmax(0,1fr))] gap-2 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  team.name === selectedTeamName ? 'bg-tamkeen-primary/5' : ''
                } ${index < standings.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
              >
                <span className="w-8 font-medium text-gray-500">{team.rank}</span>
                <span className={`font-medium truncate ${team.name === selectedTeamName ? 'text-tamkeen-primary' : ''}`}>
                  {team.name}
                </span>
                <span className="text-center font-semibold">{team.wins}-{team.losses}-{team.ties}</span>
                <span className="text-center text-sm text-gray-600 dark:text-gray-400">{team.points_for}</span>
                <span className="text-center text-sm text-gray-600 dark:text-gray-400">{team.points_against}</span>
                <span className={`text-center text-sm font-medium ${
                  team.point_diff > 0 ? 'text-green-600 dark:text-green-400' :
                  team.point_diff < 0 ? 'text-red-600 dark:text-red-400' : ''
                }`}>
                  {team.point_diff > 0 ? '+' : ''}{team.point_diff}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            PF = Points For • PA = Points Against • +/- = Point Differential
          </div>
        </div>
      )}
    </Layout>
  )
}
