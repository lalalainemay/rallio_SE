import { create } from 'zustand';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationState {
    location: Location.LocationObject | null;
    permissionStatus: Location.PermissionStatus | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    requestPermission: () => Promise<boolean>;
    getCurrentLocation: () => Promise<void>;
    calculateDistance: (lat: number, lng: number) => number | null;
}

export const useLocationStore = create<LocationState>((set, get) => ({
    location: null,
    permissionStatus: null,
    isLoading: false,
    error: null,

    requestPermission: async () => {
        try {
            set({ isLoading: true, error: null });

            const { status } = await Location.requestForegroundPermissionsAsync();
            set({ permissionStatus: status });

            if (status === 'granted') {
                // Get location immediately after permission granted
                await get().getCurrentLocation();
                return true;
            }

            return false;
        } catch (error: any) {
            set({ error: error.message || 'Failed to request location permission' });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    getCurrentLocation: async () => {
        try {
            set({ isLoading: true, error: null });

            // Check if we have permission
            const { status } = await Location.getForegroundPermissionsAsync();

            if (status !== 'granted') {
                set({ error: 'Location permission not granted' });
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            set({ location, permissionStatus: status });
        } catch (error: any) {
            set({ error: error.message || 'Failed to get current location' });
        } finally {
            set({ isLoading: false });
        }
    },

    calculateDistance: (lat: number, lng: number) => {
        const { location } = get();
        if (!location) return null;

        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat - location.coords.latitude);
        const dLng = toRad(lng - location.coords.longitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(location.coords.latitude)) *
            Math.cos(toRad(lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    },
}));

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

// Helper function to format distance
export function formatDistance(km: number | null): string {
    if (km === null) return '';
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
}
