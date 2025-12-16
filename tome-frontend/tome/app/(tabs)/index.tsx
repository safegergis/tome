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
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { ReadingSessionModal } from '@/components/reading-session/reading-session-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { SpeedDialMenu } from '@/components/ui/speed-dial-menu';
import { CreateListModal } from '@/components/list/create-list-modal';
import { ActivityCard } from '@/components/ui/activity-card';
import { activityFeedApi } from '@/services/activity-feed.service';
import { ActivityFeedItem } from '@/types/activity';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { bookApi, BookDTO } from '@/services/api';

const TRENDING_BOOK_IDS = [1061192, 1061193, 1061194, 1061195];

export default function HomeScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { token } = useAuth();
    const [sessionModalVisible, setSessionModalVisible] = useState(false);
    const [speedDialOpen, setSpeedDialOpen] = useState(false);
    const [createListModalVisible, setCreateListModalVisible] = useState(false);

    // Activity feed state
    const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);
    const [activityPage, setActivityPage] = useState(0);
    const [hasMoreActivities, setHasMoreActivities] = useState(true);

    // Trending books state
    const [trendingBooks, setTrendingBooks] = useState<BookData[]>([]);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [trendingError, setTrendingError] = useState<string | null>(null);

    const handleSearchPress = () => {
        // Search is now a tab, so no need to navigate
        router.push('/(tabs)/search');
    };

    const handleBookPress = (book: BookData) => {
        router.push(`/books/${book.id}`);
    };

    // Fetch trending books
    useEffect(() => {
        fetchTrendingBooks();
    }, []);

    const fetchTrendingBooks = async () => {
        try {
            setTrendingLoading(true);
            setTrendingError(null);

            // Fetch all trending books in parallel
            const bookPromises = TRENDING_BOOK_IDS.map(id =>
                bookApi.getBookById(id).catch(error => {
                    console.error(`[HomeScreen] Error fetching book ${id}:`, error);
                    return null;
                })
            );

            const books = await Promise.all(bookPromises);

            // Filter out any failed fetches and convert to BookData format
            const validBooks: BookData[] = books
                .filter((book): book is BookDTO => book !== null)
                .map(book => ({
                    id: book.id.toString(),
                    title: book.title,
                    author: book.authors?.map(a => a.name).join(', ') || 'Unknown Author',
                    coverUrl: book.coverUrl,
                    isbn10: book.isbn10,
                    isbn13: book.isbn13,
                }));

            setTrendingBooks(validBooks);
        } catch (error) {
            console.error('[HomeScreen] Error fetching trending books:', error);
            setTrendingError('Failed to load trending books');
        } finally {
            setTrendingLoading(false);
        }
    };

    // Fetch activity feed
    useEffect(() => {
        if (token) {
            fetchActivityFeed(0);
        }
    }, [token]);

    const fetchActivityFeed = async (page: number) => {
        try {
            setActivitiesLoading(true);
            setActivitiesError(null);
            const result = await activityFeedApi.getActivityFeed(token!, page, 10);

            if (page === 0) {
                setActivities(result.content);
            } else {
                setActivities(prev => [...prev, ...result.content]);
            }

            setHasMoreActivities(!result.last);
            setActivityPage(page);
        } catch (error) {
            console.error('[HomeScreen] Error fetching activity feed:', error);
            setActivitiesError('Failed to load activity feed');
        } finally {
            setActivitiesLoading(false);
        }
    };

    const handleActivityPress = (bookId: number) => {
        router.push(`/books/${bookId}`);
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

                {/* Friends' Activity */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text, fontFamily: Fonts.serif },
                        ]}
                    >
                        Friends' Activity
                    </Text>
                    {activitiesLoading && activities.length === 0 ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : activitiesError ? (
                        <View style={styles.errorContainer}>
                            <EmptyState
                                icon="alert-circle-outline"
                                title="Error"
                                message={activitiesError}
                                actionLabel="Retry"
                                onActionPress={() => fetchActivityFeed(0)}
                            />
                        </View>
                    ) : activities.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <EmptyState
                                icon="people-outline"
                                title="No Activity Yet"
                                message="Add friends to see their reading activity"
                            />
                        </View>
                    ) : (
                        <View>
                            {activities.map(activity => (
                                <ActivityCard
                                    key={activity.id}
                                    activity={activity}
                                    onPress={handleActivityPress}
                                />
                            ))}
                            {hasMoreActivities && (
                                <View style={styles.loadMoreContainer}>
                                    <Button
                                        title={activitiesLoading ? "Loading..." : "Load More"}
                                        onPress={() => fetchActivityFeed(activityPage + 1)}
                                        variant="outlined"
                                        disabled={activitiesLoading}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Trending Books Section */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text, fontFamily: Fonts.serif },
                        ]}
                    >
                        Trending This Week
                    </Text>
                    {trendingLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : trendingError ? (
                        <View style={styles.errorContainer}>
                            <EmptyState
                                icon="alert-circle-outline"
                                title="Error"
                                message={trendingError}
                                actionLabel="Retry"
                                onActionPress={fetchTrendingBooks}
                            />
                        </View>
                    ) : (
                        <BookSection
                            title=""
                            books={trendingBooks}
                            onBookPress={handleBookPress}
                            emptyMessage="No trending books available"
                        />
                    )}
                </View>

            </ScrollView>

            {/* Floating Action Button */}
            <FloatingActionButton
                onPress={() => setSpeedDialOpen(true)}
                bottom={Spacing.lg}
                right={Spacing.lg}
            />

            {/* Speed Dial Menu */}
            <SpeedDialMenu
                visible={speedDialOpen}
                onClose={() => setSpeedDialOpen(false)}
                onLogReading={() => {
                    setSpeedDialOpen(false);
                    setSessionModalVisible(true);
                }}
                onCreateList={() => {
                    setSpeedDialOpen(false);
                    setCreateListModalVisible(true);
                }}
            />

            {/* Reading Session Modal */}
            <ReadingSessionModal
                visible={sessionModalVisible}
                onClose={() => setSessionModalVisible(false)}
            />

            {/* Create List Modal */}
            <CreateListModal
                visible={createListModalVisible}
                onClose={() => setCreateListModalVisible(false)}
                onSuccess={(listId) => {
                    setCreateListModalVisible(false);
                    router.push(`/lists/${listId}`);
                }}
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
    loadingContainer: {
        paddingVertical: Spacing.xl,
        alignItems: 'center',
    },
    errorContainer: {
        paddingHorizontal: Spacing.lg,
    },
    emptyContainer: {
        paddingHorizontal: Spacing.lg,
    },
    loadMoreContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.base,
    },
});
