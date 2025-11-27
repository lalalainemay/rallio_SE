'use client'

import { useState } from 'react'
import { recordMatchScore } from '@/app/actions/match-actions'
import { X, Trophy, Users, Loader2, CheckCircle } from 'lucide-react'
import { MatchTimer } from './match-timer'

interface ScoreRecordingModalProps {
  isOpen: boolean
  onClose: () => void
  match: {
    id: string
    matchNumber: number
    gameFormat: string
    status?: string
    started_at?: Date | string | null
    completed_at?: Date | string | null
    teamAPlayers: Array<{ id: string; name: string; avatarUrl?: string }>
    teamBPlayers: Array<{ id: string; name: string; avatarUrl?: string }>
  }
  sessionId: string
  onSuccess?: () => void
}

export function ScoreRecordingModal({
  isOpen,
  onClose,
  match,
  sessionId,
  onSuccess,
}: ScoreRecordingModalProps) {
  const [scoreA, setScoreA] = useState<number>(0)
  const [scoreB, setScoreB] = useState<number>(0)
  const [winner, setWinner] = useState<'team_a' | 'team_b' | 'draw' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (!winner) {
        throw new Error('Please select a winner')
      }

      const result = await recordMatchScore(match.id, {
        teamAScore: scoreA,
        teamBScore: scoreB,
        winner,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to record score')
      }

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-determine winner based on scores
  const handleScoreChange = (team: 'a' | 'b', value: number) => {
    if (team === 'a') {
      setScoreA(value)
      if (value > scoreB && value >= 21) {
        setWinner('team_a')
      } else if (scoreB > value && scoreB >= 21) {
        setWinner('team_b')
      } else if (value === scoreB && value >= 21) {
        setWinner('draw')
      }
    } else {
      setScoreB(value)
      if (value > scoreA && value >= 21) {
        setWinner('team_b')
      } else if (scoreA > value && scoreA >= 21) {
        setWinner('team_a')
      } else if (value === scoreA && value >= 21) {
        setWinner('draw')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Record Match Score</h2>
                <div className="flex items-center gap-3">
                  <p className="text-white/80 text-sm">Match #{match.matchNumber} - {match.gameFormat}</p>
                  {match.started_at && (
                    <div className="text-white/90 text-sm flex items-center gap-1.5">
                      <span>•</span>
                      <MatchTimer
                        startedAt={match.started_at}
                        completedAt={match.completed_at}
                        className="text-white/90"
                        showIcon={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Teams Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team A */}
            <div className={`border-2 rounded-xl p-4 transition-all ${
              winner === 'team_a' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Team A</h3>
                {winner === 'team_a' && (
                  <Trophy className="w-4 h-4 text-green-600 ml-auto" />
                )}
              </div>
              <div className="space-y-2">
                {match.teamAPlayers.map((player, idx) => (
                  <div key={player.id} className="flex items-center gap-2">
                    {player.avatarUrl ? (
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-700">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div className={`border-2 rounded-xl p-4 transition-all ${
              winner === 'team_b' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Team B</h3>
                {winner === 'team_b' && (
                  <Trophy className="w-4 h-4 text-green-600 ml-auto" />
                )}
              </div>
              <div className="space-y-2">
                {match.teamBPlayers.map((player, idx) => (
                  <div key={player.id} className="flex items-center gap-2">
                    {player.avatarUrl ? (
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-xs font-medium text-orange-700">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-700">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Final Score <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-gray-600 mb-2">Team A</span>
                <input
                  type="number"
                  value={scoreA}
                  onChange={(e) => handleScoreChange('a', parseInt(e.target.value) || 0)}
                  min="0"
                  max="99"
                  required
                  className="w-24 h-24 text-4xl font-bold text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="text-2xl font-bold text-gray-400">VS</div>
              
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-gray-600 mb-2">Team B</span>
                <input
                  type="number"
                  value={scoreB}
                  onChange={(e) => handleScoreChange('b', parseInt(e.target.value) || 0)}
                  min="0"
                  max="99"
                  required
                  className="w-24 h-24 text-4xl font-bold text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Winner Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Winner <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setWinner('team_a')}
                className={`p-4 border-2 rounded-lg font-medium transition-all ${
                  winner === 'team_a'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Team A
              </button>
              <button
                type="button"
                onClick={() => setWinner('draw')}
                className={`p-4 border-2 rounded-lg font-medium transition-all ${
                  winner === 'draw'
                    ? 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Draw
              </button>
              <button
                type="button"
                onClick={() => setWinner('team_b')}
                className={`p-4 border-2 rounded-lg font-medium transition-all ${
                  winner === 'team_b'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Team B
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !winner}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Record Score
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
