import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import { Card, Button } from '@/components/ui';
import { useBookingStore } from '@/store/booking-store';
import { supabase } from '@/lib/supabase';

interface Court {
    id: string;
    name: string;
    hourly_rate: number;
    court_type: string;
    is_active: boolean;
}

interface Venue {
    id: string;
    name: string;
    opening_hours: Record<string, { open: string; close: string }> | null;
}

interface TimeSlot {
    time: string;
    available: boolean;
}

export default function BookingScreen() {
    const { id: venueId } = useLocalSearchParams<{ id: string }>();
    const { setBookingData } = useBookingStore();

    const [venue, setVenue] = useState<Venue | null>(null);
    const [courts, setCourts] = useState<Court[]>([]);
    const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

    // Form State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [duration, setDuration] = useState(1);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [numPlayers, setNumPlayers] = useState(2);

    // Data State
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchVenueData();
    }, [venueId]);

    const fetchVenueData = async () => {
        if (!venueId) return;
        setIsLoading(true);

        try {
            // Fetch Venue
            const { data: venueData, error: venueError } = await supabase
                .from('venues')
                .select('id, name, opening_hours')
                .eq('id', venueId)
                .single();

            if (venueError) throw venueError;
            setVenue(venueData);

            // Fetch Courts
            const { data: courtsData, error: courtsError } = await supabase
                .from('courts')
                .select('*')
                .eq('venue_id', venueId)
                .eq('is_active', true)
                .order('name');

            if (courtsError) throw courtsError;
            setCourts(courtsData);

            if (courtsData.length > 0) {
                setSelectedCourt(courtsData[0]);
            }

        } catch (error: any) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load court information');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Slots when dependencies change
    useEffect(() => {
        if (selectedCourt && venue) {
            fetchTimeSlots();
        }
    }, [selectedCourt, selectedDate, venue]);

    const fetchTimeSlots = async () => {
        if (!selectedCourt || !venue) return;
        setIsLoadingSlots(true);
        setSelectedTime(null); // Reset selection

        try {
            // 1. Determine Opening Hours for the Day
            const dayName = format(selectedDate, 'eeee').toLowerCase(); // monday, tuesday...
            const hours = venue.opening_hours?.[dayName];

            if (!hours) {
                setTimeSlots([]); // Closed today
                setIsLoadingSlots(false);
                return;
            }

            const [openHour] = hours.open.split(':').map(Number);
            const [closeHour] = hours.close.split(':').map(Number);

            // 2. Generate All Slots
            const allSlots: TimeSlot[] = [];
            for (let h = openHour; h < closeHour; h++) {
                allSlots.push({
                    time: `${h.toString().padStart(2, '0')}:00`,
                    available: true
                });
            }

            // 3. Filter Past Slots (if today)
            const now = new Date();
            if (isSameDay(selectedDate, now)) {
                const currentHour = now.getHours();
                for (const slot of allSlots) {
                    const slotHour = parseInt(slot.time.split(':')[0]);
                    if (slotHour <= currentHour) {
                        slot.available = false;
                    }
                }
            }

            // 4. Fetch Existing Reservations & Queues
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            const [reservationsRes, queueRes] = await Promise.all([
                supabase
                    .from('reservations')
                    .select('start_time, end_time, status')
                    .eq('court_id', selectedCourt.id)
                    .gte('start_time', `${dateStr}T00:00:00`)
                    .lte('start_time', `${dateStr}T23:59:59`)
                    .in('status', ['pending_payment', 'pending', 'paid', 'confirmed']),

                supabase
                    .from('queue_sessions')
                    .select('start_time, end_time, status')
                    .eq('court_id', selectedCourt.id)
                    .gte('start_time', `${dateStr}T00:00:00`)
                    .lte('start_time', `${dateStr}T23:59:59`)
                    .in('status', ['active', 'pending_approval', 'draft'])
            ]);

            const blockedRanges: { start: number; end: number }[] = [];

            // Helper to parse ranges
            const parseRange = (startIso: string, endIso: string) => {
                const s = new Date(startIso);
                const e = new Date(endIso);
                const startH = s.getHours();
                // If ends at :00, effectively exclusive. If :30, block next hour too (simple logic)
                const endH = e.getMinutes() > 0 ? e.getHours() + 1 : e.getHours();
                return { start: startH, end: endH };
            };

            reservationsRes.data?.forEach(r => blockedRanges.push(parseRange(r.start_time, r.end_time)));
            queueRes.data?.forEach(q => blockedRanges.push(parseRange(q.start_time, q.end_time)));

            // 5. Mark Unavailable
            allSlots.forEach(slot => {
                const slotHour = parseInt(slot.time.split(':')[0]);

                const isBlocked = blockedRanges.some(r => slotHour >= r.start && slotHour < r.end);
                if (isBlocked) {
                    slot.available = false;
                }
            });

            setTimeSlots(allSlots);

        } catch (error) {
            console.error('Error fetching slots:', error);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const isDurationAvailable = (startTime: string) => {
        if (!timeSlots.length) return false;
        const startHour = parseInt(startTime.split(':')[0]);

        for (let i = 0; i < duration; i++) {
            const checkHour = startHour + i;
            const slot = timeSlots.find(s => parseInt(s.time.split(':')[0]) === checkHour);
            if (!slot || !slot.available) return false;
        }
        return true;
    };

    const getEndTime = (start: string, dur: number) => {
        const [h] = start.split(':').map(Number);
        const endH = h + dur;
        return `${endH.toString().padStart(2, '0')}:00`;
    };

    const handleContinue = () => {
        if (!selectedCourt || !selectedTime || !venue) return;

        const endTime = getEndTime(selectedTime, duration);
        const totalPrice = selectedCourt.hourly_rate * duration;

        setBookingData({
            venueId: venue.id,
            venueName: venue.name,
            courtId: selectedCourt.id,
            courtName: selectedCourt.name,
            courtType: selectedCourt.court_type,
            date: selectedDate.toISOString(),
            startTime: selectedTime,
            endTime,
            duration,
            hourlyRate: selectedCourt.hourly_rate,
            totalAmount: totalPrice,
            numPlayers
        });

        router.push('/checkout');
    };

    const renderDateItem = (date: Date, isSelected: boolean) => (
        <TouchableOpacity
            key={date.toISOString()}
            style={[styles.dateItem, isSelected && styles.dateItemSelected]}
            onPress={() => setSelectedDate(date)}
        >
            <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                {format(date, 'EEE')}
            </Text>
            <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>
                {format(date, 'd')}
            </Text>
        </TouchableOpacity>
    );

    const generateDates = () => {
        const dates = [];
        for (let i = 0; i < 14; i++) {
            dates.push(addDays(new Date(), i));
        }
        return dates;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Court</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* 1. Court Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Court</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {courts.map(court => (
                            <TouchableOpacity
                                key={court.id}
                                style={[
                                    styles.courtItem,
                                    selectedCourt?.id === court.id && styles.courtItemSelected
                                ]}
                                onPress={() => setSelectedCourt(court)}
                            >
                                <Text style={[
                                    styles.courtName,
                                    selectedCourt?.id === court.id && styles.courtNameSelected
                                ]}>
                                    {court.name}
                                </Text>
                                <Text style={[
                                    styles.courtPrice,
                                    selectedCourt?.id === court.id && styles.courtNameSelected
                                ]}>
                                    ₱{court.hourly_rate}/hr
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 2. Date Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Date</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {generateDates().map(date =>
                            renderDateItem(date, isSameDay(date, selectedDate))
                        )}
                    </ScrollView>
                </View>

                {/* 3. Duration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Duration</Text>
                    <View style={styles.durationContainer}>
                        {[1, 1.5, 2, 3].map(dur => (
                            <TouchableOpacity
                                key={dur}
                                style={[
                                    styles.durationItem,
                                    duration === dur && styles.durationItemSelected
                                ]}
                                onPress={() => setDuration(dur)}
                            >
                                <Text style={[
                                    styles.durationText,
                                    duration === dur && styles.durationTextSelected
                                ]}>{dur}h</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 4. Time Slots */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Time</Text>
                    {isLoadingSlots ? (
                        <ActivityIndicator color={Colors.dark.primary} style={{ marginTop: 20 }} />
                    ) : timeSlots.length === 0 ? (
                        <Text style={styles.noSlotsText}>No available slots for this date.</Text>
                    ) : (
                        <View style={styles.slotsGrid}>
                            {timeSlots.map((slot) => {
                                const isAvailable = slot.available;
                                const isSelected = selectedTime === slot.time;
                                const isCompatible = isAvailable && isDurationAvailable(slot.time);

                                return (
                                    <TouchableOpacity
                                        key={slot.time}
                                        style={[
                                            styles.slotItem,
                                            !isCompatible && styles.slotItemDisabled,
                                            isSelected && styles.slotItemSelected
                                        ]}
                                        disabled={!isCompatible}
                                        onPress={() => setSelectedTime(slot.time)}
                                    >
                                        <Text style={[
                                            styles.slotText,
                                            !isCompatible && styles.slotTextDisabled,
                                            isSelected && styles.slotTextSelected
                                        ]}>
                                            {slot.time}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* 5. Players */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Number of Players</Text>
                    <View style={styles.playerControl}>
                        <TouchableOpacity
                            style={styles.playerBtn}
                            onPress={() => setNumPlayers(Math.max(1, numPlayers - 1))}
                        >
                            <Ionicons name="remove" size={20} color={Colors.dark.text} />
                        </TouchableOpacity>
                        <Text style={styles.playerCount}>{numPlayers}</Text>
                        <TouchableOpacity
                            style={styles.playerBtn}
                            onPress={() => setNumPlayers(Math.min(4, numPlayers + 1))}
                        >
                            <Ionicons name="add" size={20} color={Colors.dark.text} />
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            <Card variant="glass" padding="md" style={styles.footer}>
                <View style={styles.footerRow}>
                    <View>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalPrice}>
                            {selectedCourt ? `₱${selectedCourt.hourly_rate * duration}` : '₱0'}
                        </Text>
                    </View>
                    <Button
                        style={styles.bookButton}
                        disabled={!selectedTime}
                        onPress={handleContinue}
                    >
                        Continue
                    </Button>
                </View>
            </Card>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.dark.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...Typography.h3,
        color: Colors.dark.text,
    },
    content: {
        paddingBottom: 100,
    },
    section: {
        padding: Spacing.lg,
        paddingBottom: 0,
    },
    sectionTitle: {
        ...Typography.h4,
        color: Colors.dark.text,
        marginBottom: Spacing.md,
    },
    horizontalScroll: {
        marginHorizontal: -Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    courtItem: {
        backgroundColor: Colors.dark.surface,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        marginRight: Spacing.md,
        minWidth: 120,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    courtItemSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.primary + '15',
    },
    courtName: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    courtNameSelected: {
        color: Colors.dark.primary,
    },
    courtPrice: {
        ...Typography.caption,
        color: Colors.dark.textSecondary,
    },
    dateItem: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.surface,
        width: 60,
        height: 70,
        borderRadius: Radius.lg,
        marginRight: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    dateItemSelected: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    dateDay: {
        ...Typography.caption,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    dateNum: {
        ...Typography.h4,
        color: Colors.dark.text,
    },
    dateTextSelected: {
        color: 'white',
    },
    durationContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    durationItem: {
        flex: 1,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.dark.surface,
        borderRadius: Radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    durationItemSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.primary + '15',
    },
    durationText: {
        ...Typography.body,
        color: Colors.dark.text,
        fontWeight: '600',
    },
    durationTextSelected: {
        color: Colors.dark.primary,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    slotItem: {
        width: '23%',
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    slotItemDisabled: {
        opacity: 0.3,
        backgroundColor: Colors.dark.background,
    },
    slotItemSelected: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    slotText: {
        ...Typography.caption,
        color: Colors.dark.text,
    },
    slotTextDisabled: {
        color: Colors.dark.textTertiary,
    },
    slotTextSelected: {
        color: 'white',
        fontWeight: '600',
    },
    noSlotsText: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        fontStyle: 'italic',
    },
    playerControl: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.dark.surface,
        borderRadius: Radius.full,
        padding: 4,
    },
    playerBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.dark.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerCount: {
        ...Typography.h4,
        color: Colors.dark.text,
        marginHorizontal: Spacing.lg,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalLabel: {
        ...Typography.caption,
        color: Colors.dark.textSecondary,
    },
    totalPrice: {
        ...Typography.h2,
        color: Colors.dark.primary,
    },
    bookButton: {
        paddingHorizontal: Spacing.xl,
    },
});
