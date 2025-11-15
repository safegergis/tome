import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authService } from '@/services/auth.service';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const userId = Number(params.userId);
  const email = params.email as string;
  const username = params.username as string;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    if (code.length !== 6) {
      setError('Verification code must be 6 characters');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await authService.verifyEmail({
        userId,
        code: code.toUpperCase(),
      });

      // Verification successful
      Alert.alert(
        'Success!',
        'Your email has been verified. Welcome to Tome!',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');

    try {
      await authService.resendVerification({ email });

      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email.'
      );
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to resend verification code. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
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
          <Text
            style={[
              styles.icon,
              { color: colors.primary, fontFamily: Fonts.serif },
            ]}
          >
            ✉️
          </Text>

          <Text
            style={[
              styles.title,
              { color: colors.text, fontFamily: Fonts.serif },
            ]}
          >
            Check Your Email
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary, fontFamily: Fonts.serif },
            ]}
          >
            We've sent a 6-character verification code to
          </Text>
          <Text
            style={[
              styles.email,
              { color: colors.primary, fontFamily: Fonts.serif },
            ]}
          >
            {email}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Verification Code"
            placeholder="ABC123"
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              if (error) setError('');
            }}
            autoCapitalize="characters"
            maxLength={6}
            error={error}
            style={styles.codeInput}
            inputStyle={styles.codeInputText}
          />

          <Button
            title="Verify Email"
            onPress={handleVerify}
            variant="primary"
            fullWidth
            loading={isVerifying}
            style={{ marginTop: Spacing.lg }}
          />

          <View style={styles.resendContainer}>
            <Text
              style={[
                styles.resendText,
                { color: colors.textSecondary, fontFamily: Fonts.serif },
              ]}
            >
              Didn't receive the code?{' '}
            </Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResending}
            >
              <Text
                style={[
                  styles.resendLink,
                  {
                    color: isResending ? colors.textSecondary : colors.primary,
                    fontFamily: Fonts.serif,
                  },
                ]}
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text
              style={[
                styles.backText,
                { color: colors.textSecondary, fontFamily: Fonts.serif },
              ]}
            >
              ← Back to Registration
            </Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  form: {
    flex: 1,
  },
  codeInput: {
    marginTop: Spacing.md,
  },
  codeInputText: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  resendText: {
    ...Typography.body,
  },
  resendLink: {
    ...Typography.body,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: Spacing.xl,
  },
  backText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
