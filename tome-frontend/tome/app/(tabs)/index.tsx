import React, { useState } from 'react';
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
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { ReadingSessionModal } from '@/components/reading-session/reading-session-modal';
import { EmptyState } from '@/components/ui/empty-state';

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
    const [sessionModalVisible, setSessionModalVisible] = useState(false);

    const handleSearchPress = () => {
        // Search is now a tab, so no need to navigate
        router.push('/(tabs)/search');
    };

    const handleBookPress = (book: BookData) => {
        router.push(`/books/${book.id}`);
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

                {/* Friends' Activity Placeholder */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text, fontFamily: Fonts.serif },
                        ]}
                    >
                        Friends' Activity
                    </Text>
                    <EmptyState
                        icon="people-outline"
                        title="Coming Soon"
                        message="See what your friends are reading in a future update"
                    />
                </View>

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
    sectionTitle: {
        ...Typography.h3,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.base,
    },
});
