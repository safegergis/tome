import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SearchBar } from '@/components/ui/search-bar';
import { BookSection } from '@/components/ui/book-section';
import { BookData } from '@/components/ui/book-card';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { ReadingSessionModal } from '@/components/reading-session/reading-session-modal';
import { readingSessionApi } from '@/services/reading-session.service';
import { useAuth } from '@/context/AuthContext';

// Mock data - replace with real data from your backend/state management
const MOCK_CURRENT_BOOKS: BookData[] = [
    {
        id: '61911',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        progress: 45,
    },
    {
        id: '61912',
        title: '1984',
        author: 'George Orwell',
        progress: 78,
    },
    {
        id: '61913',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        progress: 23,
    },
];

const MOCK_TRENDING_BOOKS: BookData[] = [
    {
        id: '4',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
    },
    {
        id: '5',
        title: 'The Midnight Library',
        author: 'Matt Haig',
    },
    {
        id: '6',
        title: 'Atomic Habits',
        author: 'James Clear',
    },
    {
        id: '7',
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
    },
    {
        id: '8',
        title: 'Educated',
        author: 'Tara Westover',
    },
];

export default function HomeScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { token } = useAuth();
    const [sessionModalVisible, setSessionModalVisible] = useState(false);
    const [currentBooks, setCurrentBooks] = useState<BookData[]>(MOCK_CURRENT_BOOKS);

    const handleSearchPress = () => {
        router.push('/search');
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

    const handleSessionLogged = async () => {
        console.log('Session logged, refreshing data...');

        // Refresh currently reading books from API
        if (token) {
            try {
                const updatedBooks = await readingSessionApi.getCurrentlyReadingBooks(token);

                // Transform UserBookDTO to BookData format
                const transformedBooks: BookData[] = updatedBooks.map(userBook => ({
                    id: String(userBook.bookId),
                    title: userBook.book.title,
                    author: userBook.book.authorNames.join(', '),
                    coverUrl: userBook.book.coverUrl,
                    progress: userBook.progressPercentage || 0,
                }));

                setCurrentBooks(transformedBooks);
                console.log('Successfully refreshed currently reading books');
            } catch (error) {
                console.error('Failed to refresh currently reading books:', error);
                Alert.alert(
                    'Refresh Failed',
                    'Could not update your reading progress. Please refresh manually.'
                );
            }
        }
    };

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
                    books={MOCK_TRENDING_BOOKS}
                    onBookPress={handleBookPress}
                    onSeeAll={handleSeeAllTrending}
                    emptyMessage="No trending books available"
                    style={styles.section}
                />
            </ScrollView>

            {/* Floating Action Button */}
            <FloatingActionButton
                onPress={() => setSessionModalVisible(true)}
                bottom={Spacing.lg}
            />

            {/* Reading Session Modal */}
            <ReadingSessionModal
                visible={sessionModalVisible}
                onClose={() => setSessionModalVisible(false)}
                onSuccess={handleSessionLogged}
            />

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
});
