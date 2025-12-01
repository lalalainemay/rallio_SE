'use client'

import type { MatchWithDetails } from '@/app/actions/match-stats'
import { format } from 'date-fns'

interface MatchCardProps {
  match: MatchWithDetails
}

export function MatchCard({ match }: MatchCardProps) {
  const isWin = match.userWon === true
  const isLoss = match.userWon === false
  const isDraw = match.winner === 'draw'

  const userScore = match.userTeam === 'team_a' ? match.scoreA : match.scoreB
  const opponentScore = match.userTeam === 'team_a' ? match.scoreB : match.scoreA

  const hasScore = userScore !== null && opponentScore !== null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {match.queueSession?.court?.venue?.name || 'Queue Match'}
            </h3>
            {match.matchNumber && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                Match #{match.matchNumber}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {match.queueSession?.court?.name || 'Court Unknown'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {match.completedAt
              ? format(new Date(match.completedAt), 'MMM d, yyyy • h:mm a')
              : match.queueSession?.sessionDate
              ? format(new Date(match.queueSession.sessionDate), 'MMM d, yyyy')
              : 'Date unknown'}
          </p>
        </div>

        {/* Result Badge */}
        <div>
          {isWin && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
              ✓ Won
            </span>
          )}
          {isLoss && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700">
              ✗ Lost
            </span>
          )}
          {isDraw && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
              = Draw
            </span>
          )}
        </div>
      </div>

      {/* Score Display */}
      {hasScore && (
        <div className="flex items-center justify-center gap-6 py-4 mb-4 bg-gray-50 rounded-lg">
          <div className={`text-center ${isWin ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-900'}`}>
            <div className="text-3xl font-bold">{userScore}</div>
            <div className="text-xs text-gray-500 mt-1">Your Team</div>
          </div>
          <div className="text-2xl font-light text-gray-400">-</div>
          <div className={`text-center ${isLoss ? 'text-green-600' : isWin ? 'text-red-600' : 'text-gray-900'}`}>
            <div className="text-3xl font-bold">{opponentScore}</div>
            <div className="text-xs text-gray-500 mt-1">Opponents</div>
          </div>
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        {/* Your Team */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Your Team</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                You
              </div>
              <span className="text-sm text-gray-900 font-medium">You</span>
            </div>
            {match.teammateNames.map((name, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opponents */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Opponents</p>
          <div className="space-y-1">
            {match.opponentNames.map((name, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Format */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
          🏸 {match.gameFormat === 'doubles' ? 'Doubles' : match.gameFormat === 'singles' ? 'Singles' : match.gameFormat}
        </span>
      </div>
    </div>
  )
}
