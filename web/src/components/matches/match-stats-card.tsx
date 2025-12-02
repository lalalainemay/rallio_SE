'use client'

import type { PlayerStats } from '@/app/actions/match-stats'

interface MatchStatsCardProps {
  stats: PlayerStats
}

export function MatchStatsCard({ stats }: MatchStatsCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Your Performance</h2>
        {stats.skillLevel && (
          <div className="px-3 py-1 bg-white/20 rounded-full">
            <span className="text-sm font-semibold">Skill Level: {stats.skillLevel}/10</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold mb-1">{stats.totalGames}</div>
          <div className="text-sm text-white/80">Total Games</div>
        </div>

        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold mb-1 text-green-300">{stats.wins}</div>
          <div className="text-sm text-white/80">Wins</div>
        </div>

        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold mb-1 text-red-300">{stats.losses}</div>
          <div className="text-sm text-white/80">Losses</div>
        </div>

        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold mb-1">{stats.winRate}%</div>
          <div className="text-sm text-white/80">Win Rate</div>
        </div>
      </div>

      {stats.gamesThisMonth > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-white/80">
            🔥 You've played <span className="font-semibold text-white">{stats.gamesThisMonth}</span> {stats.gamesThisMonth === 1 ? 'game' : 'games'} this month
          </p>
        </div>
      )}
    </div>
  )
}
