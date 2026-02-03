import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,

    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import { Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'pending_payment' | 'paid';

interface Reservation {
    id: string;
    court_id: string;
    start_time: string;
    end_time: string;
    total_amount: number;
    status: BookingStatus;
    payment_method?: string;
    courts?: {
        name: string;
        venues?: {
            name: string;
            address: string;
            opening_hours?: any;
        };
    };
}

export default function BookingDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [booking, setBooking] = useState<Reservation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    *,
                    courts (
                        name,
                        venues (
                            name,
                            address
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setBooking(data);
        } catch (error) {
            console.error('Error details:', error);
            Alert.alert('Error', 'Failed to load booking details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelReservation = async () => {
        if (!booking) return;

        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking? Refunds are subject to the venue policy.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsCancelling(true);

                            // Call API
                            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.254.163:3000';
                            const { data: { session } } = await supabase.auth.getSession();

                            if (!session?.access_token) throw new Error('Not authenticated');

                            const response = await fetch(`${apiUrl}/api/mobile/cancel-reservation`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session.access_token}`
                                },
                                body: JSON.stringify({ reservationId: booking.id })
                            });

                            const result = await response.json();

                            if (!response.ok || !result.success) {
                                throw new Error(result.error || 'Failed to cancel');
                            }

                            Alert.alert('Success', 'Booking cancelled successfully');
                            fetchBookingDetails(); // Refresh
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to cancel');
                        } finally {
                            setIsCancelling(false);
                        }
                    }
                }
            ]
        );
    };

    if (isLoading || !booking) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const isUpcoming = startTime > new Date() && booking.status !== 'cancelled';
    const canCancel = isUpcoming && booking.status !== 'cancelled' && booking.status !== 'completed';

    // Status colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return Colors.dark.success;
            case 'pending': return Colors.dark.warning;
            case 'cancelled': return Colors.dark.error;
            default: return Colors.dark.textSecondary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Booking Details</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* QR Code Section (Only for valid bookings) */}
                {booking.status !== 'cancelled' && (
                    <View style={styles.qrContainer}>
                        <Card variant="default" style={styles.qrCard}>
                            <QRCode
                                value={booking.id}
                                size={200}
                                backgroundColor="white"
                                color="black"
                            />
                            <Text style={styles.qrLabel}>Scan at Venue</Text>
                        </Card>
                    </View>
                )}

                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                        {booking.status.toUpperCase()}
                    </Text>
                </View>

                {/* Details */}
                <Card variant="glass" padding="lg" style={styles.detailsCard}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Venue</Text>
                        <Text style={styles.value}>{booking.courts?.venues?.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Court</Text>
                        <Text style={styles.value}>{booking.courts?.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Date</Text>
                        <Text style={styles.value}>{format(startTime, 'EEEE, MMM d, yyyy')}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Time</Text>
                        <Text style={styles.value}>
                            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                        </Text>
                    </View>
                    <View style={[styles.row, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₱{booking.total_amount.toLocaleString()}</Text>
                    </View>
                </Card>

                {/* Actions */}
                {canCancel && (
                    <Button
                        variant="outline"
                        style={styles.cancelButton}
                        textStyle={{ color: Colors.dark.error }}
                        onPress={handleCancelReservation}
                        disabled={isCancelling}
                    >
                        {isCancelling ? 'Processing...' : 'Request Refund / Cancel'}
                    </Button>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.dark.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    title: {
        ...Typography.h3,
        color: Colors.dark.text,
    },
    content: {
        padding: Spacing.lg,
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    qrCard: {
        padding: Spacing.xl,
        backgroundColor: 'white',
        alignItems: 'center',
        borderRadius: Radius.lg,
    },
    qrLabel: {
        marginTop: Spacing.md,
        color: 'black',
        fontWeight: '600',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusBanner: {
        padding: Spacing.md,
        borderRadius: Radius.md,
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statusText: {
        fontWeight: '700',
        letterSpacing: 1,
    },
    detailsCard: {
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    label: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        flex: 1,
    },
    value: {
        ...Typography.body,
        color: Colors.dark.text,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    totalRow: {
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    totalLabel: {
        ...Typography.h3,
        color: Colors.dark.text,
    },
    totalValue: {
        ...Typography.h3,
        color: Colors.dark.primary,
    },
    cancelButton: {
        borderColor: Colors.dark.error,
        marginTop: Spacing.md,
    }
});
