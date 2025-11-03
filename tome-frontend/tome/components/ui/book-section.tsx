import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BookCard, BookData } from './book-card';

interface BookSectionProps {
  title: string;
  books: BookData[];
  onSeeAll?: () => void;
  onBookPress?: (book: BookData) => void;
  showProgress?: boolean;
  emptyMessage?: string;
  style?: ViewStyle;
}

export function BookSection({
  title,
  books,
  onSeeAll,
  onBookPress,
  showProgress = false,
  emptyMessage = 'No books to display',
  style,
}: BookSectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: Fonts.serif },
          ]}
        >
          {title}
        </Text>
        {onSeeAll && books.length > 0 && (
          <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
            <Text
              style={[
                styles.seeAllText,
                { color: colors.primary, fontFamily: Fonts.sans },
              ]}
            >
              See All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: colors.textSecondary, fontFamily: Fonts.serif },
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
          {books.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              onPress={onBookPress ? () => onBookPress(book) : undefined}
              showProgress={showProgress}
              style={[
                styles.bookCard,
                index === books.length - 1 && styles.lastCard,
              ]}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    ...Typography.h3,
  },
  seeAllText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  scrollContent: {
    paddingLeft: Spacing.lg,
  },
  bookCard: {
    width: 140,
    marginRight: Spacing.md,
  },
  lastCard: {
    marginRight: Spacing.lg,
  },
  emptyContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
});
