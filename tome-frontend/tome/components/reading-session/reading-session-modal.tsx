import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReadingSessionForm } from '@/components/reading-session/reading-session-form';
import { Button } from '@/components/ui/button';
import {
  ReadingSessionRequest,
  UserBookDTO,
} from '@/types/reading-session';
import { readingSessionApi } from '@/services/reading-session.service';
import { useAuth } from '@/context/AuthContext';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ReadingSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedBookId?: number | null;
}

export function ReadingSessionModal({
  visible,
  onClose,
  onSuccess,
  preselectedBookId,
}: ReadingSessionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();

  const [formData, setFormData] = useState<Partial<ReadingSessionRequest>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a mock UserBookDTO for preselected book if ID is provided
  const preselectedBook: UserBookDTO | null = preselectedBookId
    ? {
        id: 0,
        bookId: preselectedBookId,
        book: {
          id: preselectedBookId,
          title: 'Loading...',
          authorNames: [],
        },
        status: 'CURRENTLY_READING',
      }
    : null;

  const handleFormDataChange = (
    data: Partial<ReadingSessionRequest>,
    isValid: boolean
  ) => {
    setFormData(data);
    setIsFormValid(isValid);
    setError(null); // Clear error when form data changes
  };

  const handleSubmit = async () => {
    if (!isFormValid || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Submit the reading session
      await readingSessionApi.createSession(
        formData as ReadingSessionRequest,
        token
      );

      // Success!
      Alert.alert(
        'Success',
        'Reading session logged successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (err) {
      console.error('Failed to create reading session:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to log reading session';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while submitting

    // Check if form has data and warn user
    if (formData.bookId || formData.pagesRead || formData.minutesRead) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to close? Your progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: onClose,
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Log Reading Session
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ReadingSessionForm
              preselectedBook={preselectedBook}
              onFormDataChange={handleFormDataChange}
            />

            {/* Error Message */}
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer with Action Buttons */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title="Cancel"
              variant="outlined"
              onPress={handleClose}
              disabled={loading}
              style={styles.cancelButton}
            />
            <Button
              title="Log Session"
              variant="primary"
              onPress={handleSubmit}
              disabled={!isFormValid || loading}
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.h3,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
