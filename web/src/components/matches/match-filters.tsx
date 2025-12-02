'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface MatchFiltersProps {
  currentFilter: string
  totalMatches: number
}

export function MatchFilters({ currentFilter, totalMatches }: MatchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (filter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', filter)
    }
    router.push(`/matches?${params.toString()}`)
  }

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'wins', label: 'Wins' },
    { value: 'losses', label: 'Losses' },
    { value: 'draws', label: 'Draws' },
  ]

  return (
    <div className="flex items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleFilterChange(filter.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            currentFilter === filter.value
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
