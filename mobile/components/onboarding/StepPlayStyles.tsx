import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface StepPlayStylesProps {
    selectedStyles: string[];
    onToggleStyle: (style: string) => void;
    onNext: () => void;
    onBack: () => void;
}

const PLAY_STYLES = [
    'Singles',
    'Doubles',
    'Attacking / Speed',
    'Defensive',
    'All-Round',
    'Deceptive',
    'Control',
    'Net-Play Specialist',
];

export default function StepPlayStyles({ selectedStyles, onToggleStyle, onNext, onBack }: StepPlayStylesProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.dark.textSecondary} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Select Your Play Styles</Text>
                <Text style={styles.subtitle}>Select one or more styles that describe how you play.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                {PLAY_STYLES.map((style) => {
                    const isSelected = selectedStyles.includes(style);
                    return (
                        <TouchableOpacity
                            key={style}
                            style={[styles.option, isSelected && styles.optionSelected]}
                            onPress={() => onToggleStyle(style)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                {style}
                            </Text>
                            {isSelected && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.dark.primary} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <TouchableOpacity
                style={styles.button}
                onPress={onNext}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.xl,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    backText: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        marginLeft: Spacing.xs,
    },
    title: {
        ...Typography.h2,
        color: Colors.dark.text,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
    },
    list: {
        gap: Spacing.sm,
        paddingBottom: Spacing.xl,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: Radius.md,
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    optionSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.surface, // Or a very subtle tint if desired
    },
    optionText: {
        ...Typography.body,
        color: Colors.dark.text,
    },
    optionTextSelected: {
        color: Colors.dark.primary,
        fontWeight: '600',
    },
    button: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    buttonText: {
        ...Typography.button,
        color: Colors.dark.text,
    },
});
