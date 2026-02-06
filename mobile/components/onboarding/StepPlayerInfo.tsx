import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface StepPlayerInfoProps {
    data: {
        birthDate: Date | null;
        gender: string;
    };
    onUpdate: (key: string, value: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function StepPlayerInfo({ data, onUpdate, onNext, onBack }: StepPlayerInfoProps) {
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            onUpdate('birthDate', selectedDate);
        }
    };

    const isFormValid = data.birthDate && data.gender;

    return (
        <View style={styles.container}>
            <View>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.dark.textSecondary} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Add Your Details</Text>

                <View style={styles.form}>
                    <View>
                        <Text style={styles.label}>Birth Date</Text>
                        {Platform.OS === 'android' && (
                            <TouchableOpacity
                                style={styles.input}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.inputText}>
                                    {data.birthDate ? format(data.birthDate, 'MMM dd, yyyy') : 'Select Date'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {(showDatePicker || Platform.OS === 'ios') && (
                            <DateTimePicker
                                value={data.birthDate || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                                themeVariant="dark"
                                style={Platform.OS === 'ios' ? styles.datePickerIOS : undefined}
                            />
                        )}
                    </View>

                    <View>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderOptions}>
                            {['Male', 'Female', 'Other'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.genderOption,
                                        data.gender === option.toLowerCase() && styles.genderOptionSelected
                                    ]}
                                    onPress={() => onUpdate('gender', option.toLowerCase())}
                                >
                                    <Text style={[
                                        styles.genderText,
                                        data.gender === option.toLowerCase() && styles.genderTextSelected
                                    ]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, !isFormValid && styles.buttonDisabled]}
                onPress={onNext}
                disabled={!isFormValid}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Select Preferred Play Style</Text>
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
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    backText: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        marginLeft: Spacing.xs,
    },
    title: {
        ...Typography.h2,
        color: Colors.dark.text,
        marginBottom: Spacing.xl,
    },
    form: {
        gap: Spacing.xl,
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
    },
    inputText: {
        ...Typography.body,
        color: Colors.dark.text,
    },
    datePickerIOS: {
        height: 120,
        marginTop: -Spacing.md,
    },
    genderOptions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    genderOption: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        backgroundColor: Colors.dark.surface,
    },
    genderOptionSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.primary,
    },
    genderText: {
        ...Typography.body,
        color: Colors.dark.text,
    },
    genderTextSelected: {
        color: Colors.dark.text,
        fontWeight: 'bold',
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
});
