import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserBookDTO } from '@/types/reading-session';
import { Input } from '@/components/ui/input';
import { readingSessionApi } from '@/services/reading-session.service';
import { useAuth } from '@/context/AuthContext';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BookPickerProps {
  selectedBook?: UserBookDTO | null;
  onSelectBook: (book: UserBookDTO) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function BookPicker({
  selectedBook,
  onSelectBook,
  label = 'Book',
  error,
  disabled = false,
}: BookPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyReading, setCurrentlyReading] = useState<UserBookDTO[]>([]);
  const [searchResults, setSearchResults] = useState<UserBookDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch currently reading books when modal opens
  useEffect(() => {
    if (modalVisible && token) {
      fetchCurrentlyReading();
    }
  }, [modalVisible, token]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchCurrentlyReading = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const books = await readingSessionApi.getCurrentlyReadingBooks(token);
      setCurrentlyReading(books);
    } catch (err) {
      console.error('Failed to fetch currently reading books:', err);
      Alert.alert(
        'Error',
        'Failed to load your currently reading books. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!token || !query.trim()) return;

    try {
      setLoading(true);
      const results = await readingSessionApi.searchBooks(query, token);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search books:', err);
      Alert.alert('Error', 'Failed to search books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (book: UserBookDTO) => {
    onSelectBook(book);
    setModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderBookItem = ({ item }: { item: UserBookDTO }) => (
    <TouchableOpacity
      style={[styles.bookItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSelectBook(item)}
    >
      {item.book.coverUrl ? (
        <Image
          source={{ uri: item.book.coverUrl }}
          style={styles.bookCover}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.bookCover, styles.noCover, { backgroundColor: colors.backgroundAlt }]}>
          <Ionicons name="book" size={24} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
          {item.book.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.book.authorNames.join(', ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const displayBooks = searchQuery.trim() ? searchResults : currentlyReading;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.pickerButton,
          { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
          disabled && { opacity: 0.5 },
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        {selectedBook ? (
          <View style={styles.selectedBookContainer}>
            {selectedBook.book.coverUrl ? (
              <Image
                source={{ uri: selectedBook.book.coverUrl }}
                style={styles.selectedBookCover}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.selectedBookCover, styles.noCover, { backgroundColor: colors.backgroundAlt }]}>
                <Ionicons name="book" size={16} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.selectedBookInfo}>
              <Text style={[styles.selectedBookTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedBook.book.title}
              </Text>
              <Text style={[styles.selectedBookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                {selectedBook.book.authorNames.join(', ')}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Select a book
          </Text>
        )}
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}

      {/* Book Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Book</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search for a book..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              inputStyle={styles.searchInput}
            />
          </View>

          {/* Section Title */}
          {!searchQuery.trim() && (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Currently Reading
              </Text>
            </View>
          )}

          {/* Book List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : displayBooks.length > 0 ? (
            <FlatList
              data={displayBooks}
              renderItem={renderBookItem}
              keyExtractor={(item) => `${item.bookId}-${item.id}`}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery.trim()
                  ? 'No books found'
                  : 'No books currently reading.\nSearch to add one.'}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    minHeight: 56,
  },
  selectedBookContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  selectedBookCover: {
    width: 32,
    height: 48,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  selectedBookInfo: {
    flex: 1,
  },
  selectedBookTitle: {
    ...Typography.body,
    fontWeight: '500',
  },
  selectedBookAuthor: {
    ...Typography.bodySmall,
  },
  placeholderText: {
    ...Typography.body,
    flex: 1,
  },
  errorText: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h3,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  bookCover: {
    width: 40,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  noCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  bookTitle: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: Spacing.xs / 2,
  },
  bookAuthor: {
    ...Typography.bodySmall,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.base,
  },
});
