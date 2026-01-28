import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// SSR-safe storage adapter for Zustand
const getZustandStorage = (): StateStorage => {
    if (typeof window === 'undefined') {
        return {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
        };
    }
    if (Platform.OS === 'web') {
        return {
            getItem: (name: string) => localStorage.getItem(name),
            setItem: (name: string, value: string) => localStorage.setItem(name, value),
            removeItem: (name: string) => localStorage.removeItem(name),
        };
    }
    return AsyncStorage;
};

interface OnboardingState {
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            hasCompletedOnboarding: false,

            completeOnboarding: () => {
                set({ hasCompletedOnboarding: true });
            },

            resetOnboarding: () => {
                set({ hasCompletedOnboarding: false });
            },
        }),
        {
            name: 'rallio-onboarding',
            storage: createJSONStorage(() => getZustandStorage()),
        }
    )
);
