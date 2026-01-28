import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface BookingData {
    venueId: string;
    venueName: string;
    courtId: string;
    courtName: string;
    courtType: string;
    date: string; // ISO string
    startTime: string; // HH:00
    endTime: string; // HH:00
    duration: number; // hours
    hourlyRate: number;
    totalAmount: number;
    numPlayers: number;
}

interface BookingState {
    bookingData: BookingData | null;
    currentStep: 'details' | 'summary' | 'payment' | 'success';
    isLoading: boolean;
    error: string | null;

    setBookingData: (data: BookingData) => void;
    updateBookingData: (data: Partial<BookingData>) => void;
    setStep: (step: 'details' | 'summary' | 'payment' | 'success') => void;
    resetBooking: () => void;
    createReservation: (paymentMethod: 'cash' | 'wallet') => Promise<{ success: boolean; error?: string; reservationId?: string }>;
}

export const useBookingStore = create<BookingState>()(
    persist(
        (set, get) => ({
            bookingData: null,
            currentStep: 'details',
            isLoading: false,
            error: null,

            setBookingData: (data) => set({ bookingData: data, currentStep: 'details', error: null }),

            updateBookingData: (data) => set((state) => ({
                bookingData: state.bookingData ? { ...state.bookingData, ...data } : null
            })),

            setStep: (step) => set({ currentStep: step }),

            resetBooking: () => set({ bookingData: null, currentStep: 'details', isLoading: false, error: null }),

            createReservation: async (paymentMethod) => {
                const { bookingData } = get();
                if (!bookingData) return { success: false, error: 'No booking data' };

                set({ isLoading: true, error: null });

                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error('Not authenticated');

                    // Calculate timestamps
                    const [startHour] = bookingData.startTime.split(':').map(Number);
                    const startDate = new Date(bookingData.date);
                    startDate.setHours(startHour, 0, 0, 0);

                    const [endHour] = bookingData.endTime.split(':').map(Number);
                    const endDate = new Date(bookingData.date);
                    endDate.setHours(endHour, 0, 0, 0);
                    // Handle day crossover if needed (not supported yet) 

                    const startTimeISO = startDate.toISOString();
                    const endTimeISO = endDate.toISOString();

                    // Check for conflicts
                    const { data: conflicts } = await supabase
                        .from('reservations')
                        .select('id')
                        .eq('court_id', bookingData.courtId)
                        .in('status', ['pending_payment', 'pending', 'paid', 'confirmed'])
                        .lt('start_time', endTimeISO)
                        .gt('end_time', startTimeISO)
                        .neq('user_id', user.id); // Ignore own bookings here (simplified)

                    if (conflicts && conflicts.length > 0) {
                        throw new Error('This time slot is no longer available.');
                    }

                    // Create reservation
                    const { data: reservation, error } = await supabase
                        .from('reservations')
                        .insert({
                            court_id: bookingData.courtId,
                            user_id: user.id,
                            start_time: startTimeISO,
                            end_time: endTimeISO,
                            total_amount: bookingData.totalAmount,
                            amount_paid: 0,
                            status: 'pending_payment',
                            payment_type: 'full',
                            num_players: bookingData.numPlayers,
                            metadata: {
                                booking_origin: 'mobile',
                                intended_payment_method: paymentMethod,
                            }
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    set({ isLoading: false });
                    return { success: true, reservationId: reservation.id };

                } catch (err: any) {
                    console.error('Booking error:', err);
                    set({ isLoading: false, error: err.message });
                    return { success: false, error: err.message };
                }
            },
        }),
        {
            name: 'booking-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ bookingData: state.bookingData }),
        }
    )
);
