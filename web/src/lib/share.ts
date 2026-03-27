// Web Share API utilities with clipboard fallback

export interface ShareData {
  title: string
  text: string
  url?: string
}

export async function share(data: ShareData): Promise<boolean> {
  // Try native Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share(data)
      return true
    } catch (e) {
      // User cancelled or share failed
      if ((e as Error).name !== 'AbortError') {
        console.error('Share failed:', e)
      }
      return false
    }
  }

  // Fallback: copy to clipboard
  try {
    const shareText = data.url
      ? `${data.title}\n${data.text}\n${data.url}`
      : `${data.title}\n${data.text}`

    await navigator.clipboard.writeText(shareText)
    return true
  } catch (e) {
    console.error('Clipboard copy failed:', e)
    return false
  }
}

export function shareGameResult(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  status: 'live' | 'final'
): Promise<boolean> {
  const statusText = status === 'live' ? 'LIVE' : 'FINAL'
  return share({
    title: `${statusText}: ${homeTeam} vs ${awayTeam}`,
    text: `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
    url: window.location.href
  })
}

export function shareStandings(standings: { name: string; wins: number; losses: number; ties: number }[]): Promise<boolean> {
  const standingsText = standings
    .slice(0, 5)
    .map((t, i) => `${i + 1}. ${t.name} (${t.wins}-${t.losses}-${t.ties})`)
    .join('\n')

  return share({
    title: 'Tamkeen League Standings',
    text: standingsText,
    url: window.location.origin + '/standings'
  })
}

export function sharePlayerStats(
  playerName: string,
  teamName: string,
  points: number,
  ppg: number
): Promise<boolean> {
  return share({
    title: `${playerName} - ${teamName}`,
    text: `${points} PTS | ${ppg.toFixed(1)} PPG`,
    url: window.location.href
  })
}
