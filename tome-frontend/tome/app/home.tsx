import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SearchBar } from '@/components/ui/search-bar';
import { BookSection } from '@/components/ui/book-section';
import { BookData } from '@/components/ui/book-card';

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
                    books={MOCK_CURRENT_BOOKS}
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
