import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export const unstable_settings = {
    initialRouteName: 'welcome',
};

function RootNavigator() {
    const { isAuthenticated, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    // Redirect based on authentication state
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            // User is not authenticated, redirect to login
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            // User is authenticated but on auth screen, redirect to tabs
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, isLoading, segments]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="books/[id]" />
            <Stack.Screen name="(auth)" />
        </Stack>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <RootNavigator />
                <StatusBar style="auto" />
            </ThemeProvider>
        </AuthProvider>
    );
}
