import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Court {
    id: string;
    name: string;
    hourly_rate: number;
    court_type: string;
    is_active: boolean;
    court_images?: { url: string; is_primary: boolean }[];
}

export interface Venue {
    id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    opening_hours?: string;
    courts?: Court[];
    court_count?: number;
    distance?: number;
    rating?: number;
    review_count?: number;
}

interface CourtState {
    venues: Venue[];
    isLoading: boolean;
    error: string | null;
    searchQuery: string;
    filters: {
        courtType: string | null;
        maxPrice: number | null;
        maxDistance: number | null;
    };
}

interface CourtActions {
    fetchVenues: () => Promise<void>;
    searchVenues: (query: string) => void;
    setFilter: (key: keyof CourtState['filters'], value: any) => void;
    clearFilters: () => void;
    getVenueById: (id: string) => Venue | undefined;
}

type CourtStore = CourtState & CourtActions;

export const useCourtStore = create<CourtStore>()((set, get) => ({
    // State
    venues: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    filters: {
        courtType: null,
        maxPrice: null,
        maxDistance: null,
    },

    // Actions
    fetchVenues: async () => {
        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase
                .from('venues')
                .select(`
          id,
          name,
          address,
          latitude,
          longitude,
          opening_hours,
          courts (
            id,
            name,
            hourly_rate,
            court_type,
            is_active,
            court_images (
              url,
              is_primary,
              display_order
            )
          )
        `)
                .eq('is_active', true)
                .eq('is_verified', true)
                .eq('courts.is_active', true)
                .order('name');

            if (error) {
                set({ error: error.message, isLoading: false });
                return;
            }

            set({
                venues: data || [],
                isLoading: false,
                error: null,
            });
        } catch (err) {
            set({
                error: 'Failed to fetch venues',
                isLoading: false
            });
        }
    },

    searchVenues: (query: string) => {
        set({ searchQuery: query });
    },

    setFilter: (key, value) => {
        set((state) => ({
            filters: {
                ...state.filters,
                [key]: value,
            },
        }));
    },

    clearFilters: () => {
        set({
            filters: {
                courtType: null,
                maxPrice: null,
                maxDistance: null,
            },
            searchQuery: '',
        });
    },

    getVenueById: (id: string) => {
        return get().venues.find((v) => v.id === id);
    },
}));

// Selector for filtered venues
export const useFilteredVenues = () => {
    const { venues, searchQuery, filters } = useCourtStore();

    return venues.filter((venue) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = venue.name.toLowerCase().includes(query);
            const matchesAddress = venue.address.toLowerCase().includes(query);
            if (!matchesName && !matchesAddress) return false;
        }

        // Court type filter
        if (filters.courtType) {
            const hasType = venue.courts?.some(
                (c) => c.court_type === filters.courtType
            );
            if (!hasType) return false;
        }

        // Max price filter
        if (filters.maxPrice) {
            const minPrice = Math.min(
                ...(venue.courts?.map((c) => c.hourly_rate) || [Infinity])
            );
            if (minPrice > filters.maxPrice) return false;
        }

        // Distance filter (if location available)
        if (filters.maxDistance && venue.distance !== undefined) {
            if (venue.distance > filters.maxDistance) return false;
        }

        return true;
    });
};
