import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function CourtsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.dark.background },
            }}
        >
            <Stack.Screen name="[id]/index" />
            <Stack.Screen name="[id]/book" />
        </Stack>
    );
}
