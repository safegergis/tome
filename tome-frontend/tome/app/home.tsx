import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SearchBar } from '@/components/ui/search-bar';
import { BookSection } from '@/components/ui/book-section';
import { BookData } from '@/components/ui/book-card';
import { bookApi, BookDTO } from '@/services/api';

/**
 * Convert backend BookDTO to frontend BookData format
 */
function mapBookDTOToBookData(book: BookDTO, progress?: number): BookData {
  // Join author names, or use first author, or default to 'Unknown Author'
  const authorName = book.authors && book.authors.length > 0
    ? book.authors.map(a => a.name).join(', ')
    : 'Unknown Author';

  return {
    id: book.id.toString(),
    title: book.title,
    author: authorName,
    coverUrl: book.coverUrl,
    progress,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [currentBooks, setCurrentBooks] = useState<BookData[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books on component mount
  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all books from the backend
        const books = await bookApi.getAllBooks();

        // For now, treat the first 3 books as "currently reading" with mock progress
        // In a real app, this would come from user's reading status API
        const currentBooksData = books.slice(0, 3).map((book, index) =>
          mapBookDTOToBookData(book, [45, 78, 23][index])
        );

        // Treat remaining books as "trending"
        const trendingBooksData = books.slice(3, 8).map(book =>
          mapBookDTOToBookData(book)
        );

        setCurrentBooks(currentBooksData);
        setTrendingBooks(trendingBooksData);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError(err instanceof Error ? err.message : 'Failed to load books');
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  const handleSearchPress = () => {
    // Navigate to search screen when implemented
    // router.push('/search');
    console.log('Navigate to search');
  };

  const handleBookPress = (book: BookData) => {
    router.push(`/books/${book.id}`);
  };

  const handleSeeAllCurrent = () => {
    // Navigate to current books list
    console.log('See all current books');
  };

  const handleSeeAllTrending = () => {
    // Navigate to trending books
    console.log('See all trending books');
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading books...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error message if fetch failed
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
            Make sure the backend server is running
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.greeting,
              { color: colors.textSecondary, fontFamily: Fonts.sans },
            ]}
          >
            Welcome back
          </Text>
          <Text
            style={[
              styles.appName,
              { color: colors.text, fontFamily: Fonts.serif },
            ]}
          >
            Tome
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search for books..."
            onPress={handleSearchPress}
            editable={false}
          />
        </View>

        {/* Currently Reading Section */}
        <BookSection
          title="Currently Reading"
          books={currentBooks}
          onBookPress={handleBookPress}
          onSeeAll={handleSeeAllCurrent}
          showProgress
          emptyMessage="Start reading a book to see it here"
          style={styles.section}
        />

        {/* Trending Books Section */}
        <BookSection
          title="Trending This Week"
          books={trendingBooks}
          onBookPress={handleBookPress}
          onSeeAll={handleSeeAllTrending}
          emptyMessage="No trending books available"
          style={styles.section}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  greeting: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  appName: {
    ...Typography.h1,
    fontSize: 28,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  section: {
    marginTop: Spacing.base,
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
  errorText: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorHint: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
});
