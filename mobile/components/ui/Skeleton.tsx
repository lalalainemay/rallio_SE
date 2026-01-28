import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/constants/Colors';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * Animated skeleton loading placeholder
 */
export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = Radius.sm,
    style
}: SkeletonProps) {
    const shimmerProgress = useSharedValue(0);

    useEffect(() => {
        shimmerProgress.value = withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(shimmerProgress.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
        return { opacity };
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                animatedStyle,
                style,
            ]}
        />
    );
}

/**
 * Skeleton card for court listings
 */
export function CourtCardSkeleton() {
    return (
        <View style={styles.courtCard}>
            {/* Image placeholder */}
            <Skeleton width="100%" height={160} borderRadius={Radius.lg} />

            {/* Content */}
            <View style={styles.courtCardContent}>
                {/* Title */}
                <Skeleton width="70%" height={22} style={{ marginBottom: Spacing.xs }} />

                {/* Location */}
                <Skeleton width="50%" height={16} style={{ marginBottom: Spacing.sm }} />

                {/* Tags row */}
                <View style={styles.tagsRow}>
                    <Skeleton width={60} height={24} borderRadius={Radius.full} />
                    <Skeleton width={80} height={24} borderRadius={Radius.full} />
                    <Skeleton width={50} height={24} borderRadius={Radius.full} />
                </View>

                {/* Price and rating */}
                <View style={styles.bottomRow}>
                    <Skeleton width={80} height={18} />
                    <Skeleton width={60} height={18} />
                </View>
            </View>
        </View>
    );
}

/**
 * Skeleton for stats card on home screen
 */
export function StatsCardSkeleton() {
    return (
        <View style={styles.statsCard}>
            <View style={styles.statsRow}>
                {[1, 2, 3, 4].map((_, index) => (
                    <React.Fragment key={index}>
                        <View style={styles.statItem}>
                            <Skeleton width={40} height={28} style={{ marginBottom: 4 }} />
                            <Skeleton width={50} height={14} />
                        </View>
                        {index < 3 && <View style={styles.statDivider} />}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
}

/**
 * Skeleton for quick action button
 */
export function QuickActionSkeleton() {
    return (
        <View style={styles.actionCard}>
            <Skeleton width={56} height={56} borderRadius={28} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width={60} height={14} />
        </View>
    );
}

/**
 * Full court list skeleton (3 cards)
 */
export function CourtListSkeleton() {
    return (
        <View style={styles.listContainer}>
            {[1, 2, 3].map((_, index) => (
                <CourtCardSkeleton key={index} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.dark.surface,
    },
    courtCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    courtCardContent: {
        padding: Spacing.md,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.dark.border,
    },
    actionCard: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    listContainer: {
        gap: Spacing.md,
    },
});
