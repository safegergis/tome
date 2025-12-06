import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookCard, BookData } from '@/components/ui/book-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserBookDTO } from '@/types/reading-session';

interface ShelfSectionProps {
  title: string;
  description?: string;
  books: UserBookDTO[];
  loading: boolean;
  error: string | null;
  onBookPress: (bookId: string) => void;
  onSeeMore?: () => void;
  showProgress?: boolean;
  emptyMessage?: string;
}

export function ShelfSection({
  title,
  description,
  books,
  loading,
  error,
  onBookPress,
  onSeeMore,
  showProgress = false,
  emptyMessage = 'No books in this shelf',
}: ShelfSectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const convertUserBookToBookData = (userBook: UserBookDTO): BookData => {
    return {
      id: userBook.book.id.toString(),
      title: userBook.book.title,
      author: userBook.book.authorNames.join(', '),
      isbn: userBook.book.isbn13 || userBook.book.isbn10 || '',
      coverUrl: userBook.book.coverUrl,
      progress: userBook.progressPercentage
        ? Math.round(userBook.progressPercentage)
        : undefined,
    };
  };

  const displayBooks = books.slice(0, 8);
  const hasMore = books.length > 8;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.title,
              { color: colors.text, fontFamily: Fonts.serif },
            ]}
          >
            {title}
          </Text>
          {books.length > 0 && (
            <Text
              style={[
                styles.bookCount,
                { color: colors.textSecondary },
              ]}
            >
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </Text>
          )}
        </View>

        {hasMore && onSeeMore && (
          <TouchableOpacity
            onPress={onSeeMore}
            style={styles.seeMoreButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeMoreText, { color: colors.primary }]}>
              See More
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {description && (
        <Text
          style={[
            styles.description,
            { color: colors.textSecondary },
          ]}
        >
          {description}
        </Text>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.textSecondary },
            ]}
          >
            Loading {title.toLowerCase()}...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      ) : books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: colors.textSecondary },
            ]}
          >
            {emptyMessage}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayBooks.map((userBook) => (
            <BookCard
              key={userBook.id}
              book={convertUserBookToBookData(userBook)}
              onPress={() => onBookPress(userBook.book.id.toString())}
              showProgress={showProgress}
              style={styles.bookCard}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h3,
  },
  bookCount: {
    ...Typography.caption,
    fontWeight: '600',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  seeMoreText: {
    ...Typography.body,
    fontWeight: '600',
  },
  description: {
    ...Typography.bodySmall,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  bookCard: {
    width: 140,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySmall,
  },
  errorContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
  },
});
