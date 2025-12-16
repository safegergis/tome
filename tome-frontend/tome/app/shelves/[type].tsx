import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BookCard, BookData } from '@/components/ui/book-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SHELF_CONFIGS, ShelfType } from '@/types/shelf';
import { userBookApi } from '@/services/user-book.service';
import { UserBookDTO } from '@/types/reading-session';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ShelfDetailScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();

  const [books, setBooks] = useState<UserBookDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate shelf type
  const shelfType = type as ShelfType;
  const shelfConfig = SHELF_CONFIGS[shelfType];

  const isValidShelf = shelfType && shelfConfig;

  const convertUserBookToBookData = (userBook: UserBookDTO): BookData => {
    return {
      id: userBook.book.id.toString(),
      title: userBook.book.title,
      author: userBook.book.authorNames?.join(', ') || 'Unknown Author',
      isbn10: userBook.book.isbn10,
      isbn13: userBook.book.isbn13,
      coverUrl: userBook.book.coverUrl,
      progress: userBook.progressPercentage
        ? Math.round(userBook.progressPercentage)
        : undefined,
    };
  };

  const fetchShelfBooks = async (isRefreshing = false) => {
    if (!token || !isValidShelf) return;

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const shelfBooks = await userBookApi.getUserBooks(token, shelfType);
      setBooks(shelfBooks);
    } catch (err) {
      console.error(`[ShelfDetailScreen] Failed to fetch ${shelfType} books:`, err);
      setError(`Failed to load ${shelfConfig.title.toLowerCase()}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && isValidShelf) {
      fetchShelfBooks();
    }
  }, [token, type]);

  const handleRefresh = () => {
    fetchShelfBooks(true);
  };

  const handleBack = () => {
    router.back();
  };

  const handleBookPress = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

  // Show error if invalid shelf type
  if (!isValidShelf) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontFamily: Fonts.serif },
            ]}
          >
            Error
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <EmptyState
            icon="alert-circle-outline"
            title="Invalid Shelf"
            message="This shelf does not exist"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show loading spinner
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontFamily: Fonts.serif },
            ]}
          >
            {shelfConfig.title}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading {shelfConfig.title.toLowerCase()}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const showProgress = shelfType === 'currently-reading';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: Fonts.serif },
          ]}
        >
          {shelfConfig.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Shelf Info */}
        <View style={styles.shelfInfo}>
          <View style={styles.shelfHeader}>
            <Ionicons
              name={shelfConfig.icon as any}
              size={32}
              color={colors.primary}
            />
            <View style={styles.shelfTitleContainer}>
              <Text
                style={[
                  styles.shelfTitle,
                  { color: colors.text, fontFamily: Fonts.serif },
                ]}
              >
                {shelfConfig.title}
              </Text>
              <Text
                style={[
                  styles.shelfDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {shelfConfig.description}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.bookCount,
              { color: colors.textSecondary },
            ]}
          >
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </Text>
        </View>

        {/* Error State */}
        {error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error"
            message={error}
            actionLabel="Try Again"
            onActionPress={() => fetchShelfBooks()}
          />
        ) : books.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={shelfConfig.icon as any}
            title="No Books Yet"
            message={shelfConfig.emptyMessage}
          />
        ) : (
          /* Books Grid */
          <View style={styles.booksGrid}>
            {books.map((userBook) => (
              <View key={userBook.id} style={styles.bookCardWrapper}>
                <BookCard
                  book={convertUserBookToBookData(userBook)}
                  onPress={() => handleBookPress(userBook.book.id.toString())}
                  showProgress={showProgress}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.base,
  },
  shelfInfo: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    marginBottom: Spacing.sm,
  },
  shelfTitleContainer: {
    flex: 1,
  },
  shelfTitle: {
    ...Typography.h2,
    marginBottom: Spacing.xs / 2,
  },
  shelfDescription: {
    ...Typography.bodySmall,
  },
  bookCount: {
    ...Typography.caption,
    fontWeight: '600',
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  bookCardWrapper: {
    width: '50%',
    padding: Spacing.xs,
  },
});
