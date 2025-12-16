import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReadingSessionForm } from '@/components/reading-session/reading-session-form';
import { Button } from '@/components/ui/button';
import {
  ReadingSessionRequest,
  UserBookDTO,
} from '@/types/reading-session';
import { readingSessionApi } from '@/services/reading-session.service';
import { userBookApi } from '@/services/user-book.service';
import { bookApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Fonts,
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
  const [markingFinished, setMarkingFinished] = useState(false);
  const [markingDNF, setMarkingDNF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preselectedBook, setPreselectedBook] = useState<UserBookDTO | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);

  // Fetch book details when preselectedBookId changes
  useEffect(() => {
    async function fetchPreselectedBook() {
      if (!preselectedBookId) {
        setPreselectedBook(null);
        return;
      }

      try {
        setLoadingBook(true);
        const bookData = await bookApi.getBookById(preselectedBookId);

        // Convert BookDTO to UserBookDTO format
        const userBook: UserBookDTO = {
          id: 0, // Not a user book yet
          bookId: bookData.id,
          book: {
            id: bookData.id,
            title: bookData.title,
            isbn: bookData.isbn10,
            coverUrl: bookData.coverUrl,
            authorNames: bookData.authors?.map(a => a.name) || [],
            pageCount: bookData.pageCount,
            ebookPageCount: bookData.ebookPageCount,
            audioLengthSeconds: bookData.audioLengthSeconds,
          },
          status: 'CURRENTLY_READING',
        };

        setPreselectedBook(userBook);
      } catch (err) {
        console.error('Failed to fetch preselected book:', err);
        setError('Failed to load book details. Please try again.');
      } finally {
        setLoadingBook(false);
      }
    }

    if (visible) {
      fetchPreselectedBook();
    }
  }, [preselectedBookId, visible]);

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

  const handleMarkAsFinished = async () => {
    if (!token) {
      setError('You must be logged in to mark a book as finished');
      return;
    }

    // Get the current book from formData
    const bookId = formData.bookId;
    if (!bookId) {
      setError('Please select a book first');
      return;
    }

    try {
      setMarkingFinished(true);
      setError(null);

      // First, check if the book is already on the user's shelf
      const allUserBooks = await userBookApi.getUserBooks(token);
      const existingUserBook = allUserBooks.find(ub => ub.bookId === bookId);

      if (existingUserBook) {
        // Update existing book to 'read' status
        await userBookApi.updateReadingStatus(existingUserBook.id, 'read', token);
      } else {
        // Add book to shelf with 'read' status
        await userBookApi.addBookToShelf(bookId, 'READ', token);
      }

      Alert.alert(
        'Success',
        'Book marked as finished!',
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
      console.error('Failed to mark as finished:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to mark book as finished';
      setError(errorMessage);
    } finally {
      setMarkingFinished(false);
    }
  };

  const handleMarkAsDNF = async () => {
    if (!token) {
      setError('You must be logged in to mark a book as DNF');
      return;
    }

    // Get the current book from formData
    const bookId = formData.bookId;
    if (!bookId) {
      setError('Please select a book first');
      return;
    }

    try {
      setMarkingDNF(true);
      setError(null);

      // First, check if the book is already on the user's shelf
      const allUserBooks = await userBookApi.getUserBooks(token);
      const existingUserBook = allUserBooks.find(ub => ub.bookId === bookId);

      if (existingUserBook) {
        // Mark existing book as DNF using the dedicated endpoint
        await userBookApi.markAsDidNotFinish(existingUserBook.id, token);
      } else {
        // Add book to shelf with 'did-not-finish' status
        await userBookApi.addBookToShelf(bookId, 'DID_NOT_FINISH', token);
      }

      Alert.alert(
        'Success',
        'Book marked as Did Not Finish',
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
      console.error('Failed to mark as DNF:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to mark book as DNF';
      setError(errorMessage);
    } finally {
      setMarkingDNF(false);
    }
  };

  const handleClose = () => {
    if (loading || markingFinished || markingDNF) return; // Prevent closing while submitting

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
            <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.serif }]}>
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
            {loadingBook ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.serif }]}>
                  Loading book details...
                </Text>
              </View>
            ) : (
              <ReadingSessionForm
                preselectedBook={preselectedBook}
                onFormDataChange={handleFormDataChange}
                onMarkAsFinished={handleMarkAsFinished}
                onMarkAsDNF={handleMarkAsDNF}
                markingFinished={markingFinished}
                markingDNF={markingDNF}
              />
            )}

            {/* Error Message */}
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.sans }]}>
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
              disabled={loading || markingFinished || markingDNF}
              style={styles.cancelButton}
            />
            <Button
              title="Log Session"
              variant="primary"
              onPress={handleSubmit}
              disabled={!isFormValid || loading || markingFinished || markingDNF}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.base,
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
