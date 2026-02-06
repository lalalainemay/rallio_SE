import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

interface StepIntroProps {
    onNext: () => void;
}

export default function StepIntro({ onNext }: StepIntroProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="account-edit" size={64} color={Colors.dark.primary} />
                    <View style={styles.iconBadge}>
                        <Ionicons name="checkmark-circle" size={32} color={Colors.dark.primary} />
                    </View>
                </View>

                <Text style={styles.title}>Set up your Profile in just a few minutes</Text>
                <Text style={styles.description}>
                    Tell us about your game so we can match you with the right courts and players.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={onNext}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.xl,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.dark.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    iconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.dark.background,
        borderRadius: 16,
    },
    title: {
        ...Typography.h2,
        color: Colors.dark.text,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    description: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    button: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        alignItems: 'center',
    },
    buttonText: {
        ...Typography.button,
        color: Colors.dark.text,
    },
});
