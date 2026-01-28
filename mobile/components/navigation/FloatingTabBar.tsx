import React, { useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Animated, {
    useAnimatedStyle,
    withSpring,
    interpolateColor,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/constants/Colors';

interface TabConfig {
    name: string;
    label: string;
    icon: string;
    iconSet: 'ionicons' | 'material-community';
}

const TAB_CONFIG: Record<string, TabConfig> = {
    index: { name: 'index', label: 'Home', icon: 'home', iconSet: 'ionicons' },
    courts: { name: 'courts', label: 'Courts', icon: 'badminton', iconSet: 'material-community' },
    queue: { name: 'queue', label: 'Queue', icon: 'people', iconSet: 'ionicons' },
    bookings: { name: 'bookings', label: 'Bookings', icon: 'calendar', iconSet: 'ionicons' },
    profile: { name: 'profile', label: 'Profile', icon: 'person', iconSet: 'ionicons' },
};

const HIDDEN_TABS = ['two'];

// Spring config for snappy animations
const SPRING_CONFIG = {
    damping: 15,
    stiffness: 150,
    mass: 0.5,
};

const AnimatedView = Animated.createAnimatedComponent(View);

interface TabButtonProps {
    route: { name: string; key: string };
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
}

const TabButton = React.memo(({ route, isFocused, onPress, onLongPress }: TabButtonProps) => {
    const config = TAB_CONFIG[route.name];

    if (!config) return null;

    // Animated indicator dot
    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: withSpring(isFocused ? 1 : 0, SPRING_CONFIG) },
            ],
            opacity: withSpring(isFocused ? 1 : 0, SPRING_CONFIG),
        };
    }, [isFocused]);

    // Subtle scale animation on the icon
    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: withSpring(isFocused ? 1.1 : 1, SPRING_CONFIG) },
            ],
        };
    }, [isFocused]);

    const iconColor = isFocused ? Colors.dark.primary : Colors.dark.tabIconDefault;
    const iconSize = 24;

    const renderIcon = useCallback(() => {
        if (config.iconSet === 'material-community') {
            return (
                <MaterialCommunityIcons
                    name={config.icon as any}
                    size={iconSize}
                    color={iconColor}
                />
            );
        }
        return (
            <Ionicons
                name={(isFocused ? config.icon : `${config.icon}-outline`) as any}
                size={iconSize}
                color={iconColor}
            />
        );
    }, [config, isFocused, iconColor]);

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={config.label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
        >
            <View style={styles.tabContent}>
                <AnimatedView style={animatedIconStyle}>
                    {renderIcon()}
                </AnimatedView>
                {/* Active indicator dot */}
                <AnimatedView style={[styles.indicator, animatedIndicatorStyle]} />
            </View>
        </TouchableOpacity>
    );
});

TabButton.displayName = 'TabButton';

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    const visibleRoutes = state.routes.filter(
        route => !HIDDEN_TABS.includes(route.name)
    );

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
            <View style={styles.tabBarWrapper}>
                {/* Glassmorphism blur background */}
                <BlurView
                    intensity={60}
                    tint="dark"
                    style={styles.blurView}
                />
                {/* Content overlay */}
                <View style={styles.tabBarContent}>
                    {visibleRoutes.map((route) => {
                        const actualIndex = state.routes.findIndex(r => r.key === route.key);
                        const isFocused = state.index === actualIndex;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        return (
                            <TabButton
                                key={route.key}
                                route={route}
                                isFocused={isFocused}
                                onPress={onPress}
                                onLongPress={onLongPress}
                            />
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.lg,
        backgroundColor: 'transparent',
    },
    tabBarWrapper: {
        borderRadius: 28,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    blurView: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(18, 18, 26, 0.75)',
    },
    tabBarContent: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 28,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    indicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.dark.primary,
        marginTop: 4,
    },
});
