import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/button';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WelcomeScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            <View style={styles.content}>
                {/* Logo/Icon placeholder */}

                {/* App name */}
                <Text
                    style={[
                        styles.title,
                        { color: colors.text, fontFamily: Fonts.serif },
                    ]}
                >
                    Tome
                </Text>

                {/* Tagline */}
                <Text
                    style={[
                        styles.subtitle,
                        { color: colors.textSecondary, fontFamily: Fonts.serif },
                    ]}
                >
                    Your personal book tracking companion
                </Text>

                <Text
                    style={[
                        styles.description,
                        { color: colors.textSecondary, fontFamily: Fonts.serif },
                    ]}
                >
                    Track your reading journey, create custom lists, and discover your next
                    favorite book.
                </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
                <Button
                    title="Get Started"
                    onPress={() => router.push('/(auth)/register')}
                    variant="primary"
                    fullWidth
                />
                <Button
                    title="I already have an account"
                    onPress={() => router.push('/(auth)/login')}
                    variant="outlined"
                    fullWidth
                    style={{ marginTop: Spacing.base }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xxxl,
        paddingBottom: Spacing.xl,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    logoText: {
        fontSize: 64,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    title: {
        ...Typography.h1,
        fontSize: 42,
        marginBottom: Spacing.base,
    },
    subtitle: {
        ...Typography.h3,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    description: {
        ...Typography.body,
        textAlign: 'center',
        maxWidth: '85%',
        lineHeight: 26,
    },
    actions: {
        width: '100%',
    },
});
