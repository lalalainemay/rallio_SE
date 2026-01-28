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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import { Card, Button, Avatar } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

interface Participant {
    id: string;
    user_id: string;
    status: string;
    games_played: number;
    games_won: number;
    profiles?: {
        display_name: string;
        avatar_url: string | null;
    };
}

interface QueueSession {
    id: string;
    court_id: string;
    organizer_id: string;
    start_time: string;
    end_time: string;
    mode: 'casual' | 'competitive';
    game_format: 'singles' | 'doubles' | 'mixed';
    max_players: number;
    current_players: number;
    cost_per_game: number | null;
    is_public: boolean;
    status: string;
    settings: Record<string, any> | null;
    courts?: {
        name: string;
        venues?: {
            name: string;
            address: string;
            phone?: string;
        };
    };
    profiles?: {
        display_name: string;
        avatar_url: string | null;
    };
    queue_participants?: Participant[];
}

export default function QueueDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();
    const [session, setSession] = useState<QueueSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isParticipant = session?.queue_participants?.some(p => p.user_id === user?.id);
    const spotsLeft = session ? session.max_players - session.current_players : 0;
    const isFull = spotsLeft <= 0;

    const fetchSession = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from('queue_sessions')
            .select(`
                *,
                courts (
                    name,
                    venues (
                        name,
                        address,
                        phone
                    )
                ),
                profiles!queue_sessions_organizer_id_fkey (
                    display_name,
                    avatar_url
                ),
                queue_participants (
                    id,
                    user_id,
                    status,
                    games_played,
                    games_won,
                    profiles (
                        display_name,
                        avatar_url
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setSession(data);
        }
        setIsLoading(false);
    }, [id]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const handleJoinQueue = async () => {
        if (!user || !session) return;

        setIsJoining(true);
        try {
            const { error: joinError } = await supabase
                .from('queue_participants')
                .insert({
                    queue_session_id: session.id,
                    user_id: user.id,
                    status: 'waiting',
                });

            if (joinError) throw joinError;

            Alert.alert('Success', 'You have joined the queue!', [
                { text: 'OK', onPress: fetchSession }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to join queue');
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeaveQueue = async () => {
        if (!user || !session) return;

        Alert.alert(
            'Leave Queue',
            'Are you sure you want to leave this queue session?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error: leaveError } = await supabase
                                .from('queue_participants')
                                .delete()
                                .eq('queue_session_id', session.id)
                                .eq('user_id', user.id);

                            if (leaveError) throw leaveError;
                            fetchSession();
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to leave queue');
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
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

    if (error || !session) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={Colors.dark.error} />
                    <Text style={styles.errorTitle}>Session not found</Text>
                    <Text style={styles.errorText}>{error || 'This session may no longer exist'}</Text>
                    <Button onPress={() => router.back()}>Go Back</Button>
                </View>
            </SafeAreaView>
        );
    }

    const statusColors: Record<string, string> = {
        open: Colors.dark.success,
        active: Colors.dark.primary,
        paused: Colors.dark.warning,
        closed: Colors.dark.textTertiary,
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Queue Details</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: statusColors[session.status] + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[session.status] }]} />
                    <Text style={[styles.statusText, { color: statusColors[session.status] }]}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </Text>
                    <View style={styles.modeBadge}>
                        <Text style={styles.modeText}>
                            {session.mode === 'competitive' ? '🏆 Competitive' : '🎾 Casual'}
                        </Text>
                    </View>
                </View>

                {/* Venue Info */}
                <View style={styles.section}>
                    <Text style={styles.venueName}>
                        {session.courts?.venues?.name || 'Unknown Venue'}
                    </Text>
                    <Text style={styles.courtName}>{session.courts?.name}</Text>
                    <View style={styles.addressRow}>
                        <Ionicons name="location" size={16} color={Colors.dark.textSecondary} />
                        <Text style={styles.address}>{session.courts?.venues?.address}</Text>
                    </View>
                </View>

                {/* Time & Date Card */}
                <Card variant="glass" padding="md" style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar" size={20} color={Colors.dark.primary} />
                            <View>
                                <Text style={styles.infoLabel}>Date</Text>
                                <Text style={styles.infoValue}>{formatDate(session.start_time)}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Ionicons name="time" size={20} color={Colors.dark.primary} />
                            <View>
                                <Text style={styles.infoLabel}>Time</Text>
                                <Text style={styles.infoValue}>
                                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Details Card */}
                <Card variant="glass" padding="md" style={styles.infoCard}>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Format</Text>
                            <Text style={styles.detailValue}>
                                {session.game_format.charAt(0).toUpperCase() + session.game_format.slice(1)}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Players</Text>
                            <Text style={styles.detailValue}>
                                {session.current_players}/{session.max_players}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Cost</Text>
                            <Text style={styles.detailValue}>
                                {session.cost_per_game ? `₱${session.cost_per_game}/game` : 'Free'}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Spots Left</Text>
                            <Text style={[styles.detailValue, { color: isFull ? Colors.dark.error : Colors.dark.success }]}>
                                {isFull ? 'Full' : `${spotsLeft} available`}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Organizer */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Organizer</Text>
                    <View style={styles.organizerCard}>
                        <Avatar
                            source={session.profiles?.avatar_url}
                            name={session.profiles?.display_name || 'Organizer'}
                            size="md"
                        />
                        <View style={styles.organizerInfo}>
                            <Text style={styles.organizerName}>
                                {session.profiles?.display_name || 'Unknown'}
                            </Text>
                            <Text style={styles.organizerRole}>Queue Master</Text>
                        </View>
                    </View>
                </View>

                {/* Participants */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Participants ({session.queue_participants?.length || 0})
                    </Text>
                    {session.queue_participants && session.queue_participants.length > 0 ? (
                        <View style={styles.participantsList}>
                            {session.queue_participants.map((p, index) => (
                                <View key={p.id} style={styles.participantItem}>
                                    <Avatar
                                        source={p.profiles?.avatar_url}
                                        name={p.profiles?.display_name || 'Player'}
                                        size="sm"
                                    />
                                    <Text style={styles.participantName}>
                                        {p.profiles?.display_name || 'Player'}
                                    </Text>
                                    <View style={[
                                        styles.participantStatus,
                                        { backgroundColor: p.status === 'playing' ? Colors.dark.success + '20' : Colors.dark.info + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.participantStatusText,
                                            { color: p.status === 'playing' ? Colors.dark.success : Colors.dark.info }
                                        ]}>
                                            {p.status}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.noParticipants}>No participants yet. Be the first to join!</Text>
                    )}
                </View>

                {/* Join/Leave Button */}
                <View style={styles.buttonContainer}>
                    {isParticipant ? (
                        <Button
                            variant="secondary"
                            fullWidth
                            onPress={handleLeaveQueue}
                        >
                            Leave Queue
                        </Button>
                    ) : (
                        <Button
                            fullWidth
                            onPress={handleJoinQueue}
                            disabled={isFull}
                            loading={isJoining}
                        >
                            {isFull ? 'Queue Full' : 'Join Queue'}
                        </Button>
                    )}
                </View>
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    errorTitle: {
        ...Typography.h2,
        color: Colors.dark.text,
    },
    errorText: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
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
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        gap: Spacing.sm,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        ...Typography.body,
        fontWeight: '600',
    },
    modeBadge: {
        marginLeft: 'auto',
        backgroundColor: Colors.dark.surface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    modeText: {
        ...Typography.caption,
        color: Colors.dark.text,
    },
    section: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.h3,
        color: Colors.dark.text,
        marginBottom: Spacing.md,
    },
    venueName: {
        ...Typography.h1,
        color: Colors.dark.text,
    },
    courtName: {
        ...Typography.body,
        color: Colors.dark.primary,
        marginTop: 2,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    address: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        flex: 1,
    },
    infoCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    infoDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.dark.border,
        marginHorizontal: Spacing.md,
    },
    infoLabel: {
        ...Typography.caption,
        color: Colors.dark.textSecondary,
    },
    infoValue: {
        ...Typography.body,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    detailItem: {
        width: '50%',
        paddingVertical: Spacing.xs,
    },
    detailLabel: {
        ...Typography.caption,
        color: Colors.dark.textSecondary,
    },
    detailValue: {
        ...Typography.body,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    organizerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    organizerInfo: {
        marginLeft: Spacing.md,
    },
    organizerName: {
        ...Typography.body,
        color: Colors.dark.text,
        fontWeight: '600',
    },
    organizerRole: {
        ...Typography.caption,
        color: Colors.dark.primary,
    },
    participantsList: {
        gap: Spacing.sm,
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: Spacing.sm,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    participantName: {
        ...Typography.body,
        color: Colors.dark.text,
        flex: 1,
        marginLeft: Spacing.sm,
    },
    participantStatus: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    participantStatusText: {
        ...Typography.caption,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    noParticipants: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        padding: Spacing.lg,
    },
    buttonContainer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
});
