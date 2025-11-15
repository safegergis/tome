import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        // TODO: Implement actual login logic here
        // For now, simulate API call
        setTimeout(() => {
            setIsLoading(false);
            // Navigate to main app after successful login
            router.replace('/home');
        }, 1500);
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Text style={[styles.backText, { color: colors.primary }]}>
                            ← Back
                        </Text>
                    </TouchableOpacity>

                    <Text
                        style={[
                            styles.title,
                            { color: colors.text, fontFamily: Fonts.serif },
                        ]}
                    >
                        Welcome Back
                    </Text>
                    <Text
                        style={[
                            styles.subtitle,
                            { color: colors.textSecondary, fontFamily: Fonts.serif },
                        ]}
                    >
                        Sign in to continue your reading journey
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry
                        error={errors.password}
                    />

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text
                            style={[
                                styles.forgotPasswordText,
                                { color: colors.primary, fontFamily: Fonts.serif },
                            ]}
                        >
                            Forgot Password?
                        </Text>
                    </TouchableOpacity>

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        variant="primary"
                        fullWidth
                        loading={isLoading}
                        style={{ marginTop: Spacing.lg }}
                    />

                    <View style={styles.footer}>
                        <Text
                            style={[
                                styles.footerText,
                                { color: colors.textSecondary, fontFamily: Fonts.serif },
                            ]}
                        >
                            Don't have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                            <Text
                                style={[
                                    styles.footerLink,
                                    { color: colors.primary, fontFamily: Fonts.serif },
                                ]}
                            >
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? Spacing.xxxl : Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    header: {
        marginBottom: Spacing.xxl,
    },
    backButton: {
        marginBottom: Spacing.lg,
    },
    backText: {
        ...Typography.body,
        fontWeight: '600',
    },
    title: {
        ...Typography.h1,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        ...Typography.body,
        lineHeight: 24,
    },
    form: {
        flex: 1,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: Spacing.sm,
    },
    forgotPasswordText: {
        ...Typography.bodySmall,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    footerText: {
        ...Typography.body,
    },
    footerLink: {
        ...Typography.body,
        fontWeight: '600',
    },
});
