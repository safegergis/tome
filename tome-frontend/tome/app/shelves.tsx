import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ShelfSection } from '@/components/shelf/shelf-section';
import { SHELF_CONFIGS, ShelfType } from '@/types/shelf';
import { userBookApi } from '@/services/user-book.service';
import { UserBookDTO } from '@/types/reading-session';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ShelvesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();

  // State for all shelves
  const [wantToRead, setWantToRead] = useState<UserBookDTO[]>([]);
  const [wantToReadLoading, setWantToReadLoading] = useState(true);
  const [wantToReadError, setWantToReadError] = useState<string | null>(null);

  const [currentlyReading, setCurrentlyReading] = useState<UserBookDTO[]>([]);
  const [currentlyReadingLoading, setCurrentlyReadingLoading] = useState(true);
  const [currentlyReadingError, setCurrentlyReadingError] = useState<string | null>(null);

  const [read, setRead] = useState<UserBookDTO[]>([]);
  const [readLoading, setReadLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);

  const [dnf, setDnf] = useState<UserBookDTO[]>([]);
  const [dnfLoading, setDnfLoading] = useState(true);
  const [dnfError, setDnfError] = useState<string | null>(null);

  // Fetch all shelves in parallel
  const fetchAllShelves = async () => {
    if (!token) return;

    try {
      setWantToReadLoading(true);
      setCurrentlyReadingLoading(true);
      setReadLoading(true);
      setDnfLoading(true);

      setWantToReadError(null);
      setCurrentlyReadingError(null);
      setReadError(null);
      setDnfError(null);

      const [wtrBooks, crBooks, readBooks, dnfBooks] = await Promise.all([
        userBookApi.getUserBooks(token, 'want-to-read').catch((err) => {
          console.error('[ShelvesScreen] Failed to fetch want to read:', err);
          setWantToReadError('Failed to load want to read books');
          return [];
        }),
        userBookApi.getUserBooks(token, 'currently-reading').catch((err) => {
          console.error('[ShelvesScreen] Failed to fetch currently reading:', err);
          setCurrentlyReadingError('Failed to load currently reading books');
          return [];
        }),
        userBookApi.getUserBooks(token, 'read').catch((err) => {
          console.error('[ShelvesScreen] Failed to fetch read books:', err);
          setReadError('Failed to load completed books');
          return [];
        }),
        userBookApi.getUserBooks(token, 'did-not-finish').catch((err) => {
          console.error('[ShelvesScreen] Failed to fetch DNF books:', err);
          setDnfError('Failed to load DNF books');
          return [];
        }),
      ]);

      setWantToRead(wtrBooks);
      setCurrentlyReading(crBooks);
      setRead(readBooks);
      setDnf(dnfBooks);
    } finally {
      setWantToReadLoading(false);
      setCurrentlyReadingLoading(false);
      setReadLoading(false);
      setDnfLoading(false);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchAllShelves();
      }
    }, [token])
  );

  const handleBack = () => {
    router.back();
  };

  const handleBookPress = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

  const handleSeeMore = (shelfType: ShelfType) => {
    router.push(`/shelves/${shelfType}`);
  };

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
          My Shelves
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text
          style={[
            styles.pageTitle,
            { color: colors.text, fontFamily: Fonts.serif },
          ]}
        >
          All Books
        </Text>
        <Text
          style={[
            styles.pageSubtitle,
            { color: colors.textSecondary },
          ]}
        >
          Organize and track your reading journey
        </Text>

        {/* Want to Read Shelf */}
        <ShelfSection
          title={SHELF_CONFIGS['want-to-read'].title}
          description={SHELF_CONFIGS['want-to-read'].description}
          books={wantToRead}
          loading={wantToReadLoading}
          error={wantToReadError}
          onBookPress={handleBookPress}
          onSeeMore={() => handleSeeMore('want-to-read')}
          emptyMessage={SHELF_CONFIGS['want-to-read'].emptyMessage}
        />

        {/* Currently Reading Shelf */}
        <ShelfSection
          title={SHELF_CONFIGS['currently-reading'].title}
          description={SHELF_CONFIGS['currently-reading'].description}
          books={currentlyReading}
          loading={currentlyReadingLoading}
          error={currentlyReadingError}
          onBookPress={handleBookPress}
          onSeeMore={() => handleSeeMore('currently-reading')}
          showProgress={true}
          emptyMessage={SHELF_CONFIGS['currently-reading'].emptyMessage}
        />

        {/* Read Shelf */}
        <ShelfSection
          title={SHELF_CONFIGS['read'].title}
          description={SHELF_CONFIGS['read'].description}
          books={read}
          loading={readLoading}
          error={readError}
          onBookPress={handleBookPress}
          onSeeMore={() => handleSeeMore('read')}
          emptyMessage={SHELF_CONFIGS['read'].emptyMessage}
        />

        {/* Did Not Finish Shelf */}
        <ShelfSection
          title={SHELF_CONFIGS['did-not-finish'].title}
          description={SHELF_CONFIGS['did-not-finish'].description}
          books={dnf}
          loading={dnfLoading}
          error={dnfError}
          onBookPress={handleBookPress}
          onSeeMore={() => handleSeeMore('did-not-finish')}
          emptyMessage={SHELF_CONFIGS['did-not-finish'].emptyMessage}
        />
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
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  pageTitle: {
    ...Typography.h2,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    ...Typography.body,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
