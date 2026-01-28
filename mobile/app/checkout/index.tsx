import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import { Card, Button } from '@/components/ui';
import { useBookingStore } from '@/store/booking-store';

export default function CheckoutScreen() {
    const { bookingData, isLoading, createReservation } = useBookingStore();
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');

    useEffect(() => {
        if (!bookingData) {
            Alert.alert('Error', 'No booking data found', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    }, [bookingData]);

    if (!bookingData) return null;

    const handleConfirm = async () => {
        const result = await createReservation(paymentMethod);

        if (result.success) {
            Alert.alert(
                'Booking Confirmed!',
                'Your court has been successfully booked.',
                [
                    {
                        text: 'View Bookings',
                        onPress: () => {
                            router.replace('/(tabs)/bookings');
                        }
                    }
                ]
            );
        } else {
            Alert.alert('Booking Failed', result.error || 'Something went wrong.');
        }
    };

    const formatDateStr = (iso: string) => format(parseISO(iso), 'EEEE, MMMM d, yyyy');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* 1. Summary Card */}
                <Card variant="glass" padding="lg" style={styles.card}>
                    <Text style={styles.cardTitle}>Booking Summary</Text>

                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Ionicons name="location-outline" size={20} color={Colors.dark.primary} />
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.label}>Venue</Text>
                            <Text style={styles.value}>{bookingData.venueName}</Text>
                            <Text style={styles.subValue}>{bookingData.courtName} ({bookingData.courtType})</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Ionicons name="calendar-outline" size={20} color={Colors.dark.primary} />
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.label}>Date & Time</Text>
                            <Text style={styles.value}>{formatDateStr(bookingData.date)}</Text>
                            <Text style={styles.subValue}>
                                {bookingData.startTime} - {bookingData.endTime} ({bookingData.duration}h)
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Ionicons name="people-outline" size={20} color={Colors.dark.primary} />
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.label}>Players</Text>
                            <Text style={styles.value}>{bookingData.numPlayers} People</Text>
                        </View>
                    </View>
                </Card>

                {/* 2. Payment Method */}
                <Text style={styles.sectionTitle}>Payment Method</Text>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionSelected]}
                    onPress={() => setPaymentMethod('cash')}
                >
                    <View style={styles.paymentIcon}>
                        <Ionicons name="cash-outline" size={24} color={paymentMethod === 'cash' ? Colors.dark.primary : Colors.dark.text} />
                    </View>
                    <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentTitle, paymentMethod === 'cash' && styles.textSelected]}>Cash on Venue</Text>
                        <Text style={styles.paymentDesc}>Pay at the counter when you arrive</Text>
                    </View>
                    {paymentMethod === 'cash' && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.dark.primary} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionSelected]}
                    onPress={() => setPaymentMethod('wallet')}
                >
                    <View style={styles.paymentIcon}>
                        <Ionicons name="wallet-outline" size={24} color={paymentMethod === 'wallet' ? Colors.dark.primary : Colors.dark.text} />
                    </View>
                    <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentTitle, paymentMethod === 'wallet' && styles.textSelected]}>E-Wallet</Text>
                        <Text style={styles.paymentDesc}>GCash / Maya (Coming Soon)</Text>
                    </View>
                    {paymentMethod === 'wallet' && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.dark.primary} />
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* Footer */}
            <SafeAreaView style={styles.footer}>
                <View style={styles.footerContent}>
                    <View style={styles.priceRow}>
                        <Text style={styles.totalPriceLabel}>Total Amount</Text>
                        <Text style={styles.totalPriceValue}>₱{bookingData.totalAmount}</Text>
                    </View>
                    <Button
                        fullWidth
                        onPress={handleConfirm}
                        loading={isLoading}
                    >
                        Confirm Booking
                    </Button>
                </View>
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
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
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    card: {
        marginBottom: Spacing.xl,
    },
    cardTitle: {
        ...Typography.h3,
        color: Colors.dark.text,
        marginBottom: Spacing.lg,
    },
    row: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        backgroundColor: Colors.dark.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    infoBox: {
        flex: 1,
    },
    label: {
        ...Typography.caption,
        color: Colors.dark.textSecondary,
    },
    value: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    subValue: {
        ...Typography.caption,
        color: Colors.dark.textTertiary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginLeft: 56, // Align with text
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.h4,
        color: Colors.dark.text,
        marginBottom: Spacing.md,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    paymentOptionSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.primary + '10',
    },
    paymentIcon: {
        marginRight: Spacing.md,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentTitle: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    paymentDesc: {
        ...Typography.caption,
        color: Colors.dark.textSecondary,
    },
    textSelected: {
        color: Colors.dark.primary,
    },
    footer: {
        backgroundColor: Colors.dark.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    footerContent: {
        padding: Spacing.lg,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    totalPriceLabel: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
    },
    totalPriceValue: {
        ...Typography.h1,
        color: Colors.dark.primary,
    },
});
