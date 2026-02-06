import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface StepDetailsProps {
    data: {
        firstName: string;
        lastName: string;
        middleInitial: string;
        phone: string;
        avatarUri?: string;
    };
    onUpdate: (key: string, value: string) => void;
    onNext: () => void;
}

export default function StepDetails({ data, onUpdate, onNext }: StepDetailsProps) {
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0].uri) {
            onUpdate('avatarUri', result.assets[0].uri);
        }
    };

    const isFormValid = data.firstName && data.lastName; // Phone is optional

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.title}>Add Your Details</Text>

                {/* Avatar Picker */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        {data.avatarUri ? (
                            <Image source={{ uri: data.avatarUri }} style={styles.avatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Text style={styles.initials}>
                                    {data.firstName ? data.firstName[0].toUpperCase() : '?'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <MaterialCommunityIcons name="camera" size={16} color={Colors.dark.text} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage}>
                        <Text style={styles.changePhotoText}>Change Picture</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            value={data.firstName}
                            onChangeText={(text) => onUpdate('firstName', text)}
                            placeholder="John"
                            placeholderTextColor={Colors.dark.textSecondary}
                        />
                    </View>

                    <View>
                        <Text style={styles.label}>Middle Initial</Text>
                        <TextInput
                            style={styles.input}
                            value={data.middleInitial}
                            onChangeText={(text) => onUpdate('middleInitial', text)}
                            maxLength={1}
                            placeholder="D"
                            placeholderTextColor={Colors.dark.textSecondary}
                        />
                    </View>

                    <View>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            value={data.lastName}
                            onChangeText={(text) => onUpdate('lastName', text)}
                            placeholder="Doe"
                            placeholderTextColor={Colors.dark.textSecondary}
                        />
                    </View>

                    <View>
                        <Text style={styles.label}>Phone Number <Text style={styles.optionalText}>(Optional)</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={data.phone}
                            onChangeText={(text) => {
                                // Enforce +63 prefix if user types
                                if (text.length > 0 && !text.startsWith('+63')) {
                                    if (text.startsWith('09')) {
                                        onUpdate('phone', '+63' + text.substring(1));
                                    } else if (text.startsWith('63')) {
                                        onUpdate('phone', '+' + text);
                                    } else {
                                        onUpdate('phone', '+63');
                                    }
                                } else {
                                    onUpdate('phone', text);
                                }
                            }}
                            onFocus={() => {
                                if (!data.phone) onUpdate('phone', '+63');
                            }}
                            onBlur={() => {
                                if (data.phone === '+63') onUpdate('phone', '');
                            }}
                            placeholder="+63 9XX XXX XXXX"
                            placeholderTextColor={Colors.dark.textSecondary}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, !isFormValid && styles.buttonDisabled]}
                onPress={onNext}
                disabled={!isFormValid}
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
    title: {
        ...Typography.h2,
        color: Colors.dark.text,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.dark.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    initials: {
        ...Typography.h1,
        color: Colors.dark.textSecondary,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.dark.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.dark.background,
    },
    changePhotoText: {
        ...Typography.caption,
        color: Colors.dark.primary,
    },
    form: {
        gap: Spacing.md,
    },
    label: {
        ...Typography.h4,
        color: Colors.dark.textSecondary,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: Radius.md,
        padding: Spacing.md,
        color: Colors.dark.text,
        ...Typography.body,
    },
    button: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        ...Typography.button,
        color: Colors.dark.text,
    },
    optionalText: {
        ...Typography.caption,
        color: Colors.dark.textTertiary,
        fontWeight: '400',
    },
});
