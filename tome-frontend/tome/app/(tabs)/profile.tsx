import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, Fonts, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { UserPhotoPlaceholder } from '@/components/ui/user-photo-placeholder';
import { ReadingSessionCard } from '@/components/ui/reading-session-card';
import { SegmentedControl, SegmentedControlOption } from '@/components/ui/segmented-control';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/ui/book-card';
import { readingSessionApi } from '@/services/reading-session.service';
import { listApi } from '@/services/list.service';
import { ReadingSessionDTO } from '@/types/reading-session';
import { ListDTO, ListType, BookSummaryDTO } from '@/types/list';

type ProfileView = 'activity' | 'lists';

export default function ProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user, token } = useAuth();

    // View state
    const [currentView, setCurrentView] = useState<ProfileView>('activity');

    // Activity state
    const [sessions, setSessions] = useState<ReadingSessionDTO[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [sessionsPage, setSessionsPage] = useState(1);
    const [hasMoreSessions, setHasMoreSessions] = useState(true);
    const [sessionsError, setSessionsError] = useState<string | null>(null);

    // Lists state
    const [lists, setLists] = useState<ListDTO[]>([]);
    const [selectedListId, setSelectedListId] = useState<number | null>(null);
    const [selectedListBooks, setSelectedListBooks] = useState<BookSummaryDTO[]>([]);
    const [listsLoading, setListsLoading] = useState(true);
    const [listsError, setListsError] = useState<string | null>(null);
    const [booksLoading, setBooksLoading] = useState(false);

    // Friends count (placeholder for now)
    const friendsCount = 0;

    // Fetch data on mount
    useEffect(() => {
        if (token) {
            fetchRecentSessions(1);
            fetchUserLists();
        }
    }, [token]);

    const fetchRecentSessions = async (page: number) => {
        if (!token) return;

        try {
            setSessionsLoading(true);
            setSessionsError(null);

            const limit = 20;
            const newSessions = await readingSessionApi.getRecentSessions(token, limit);

            if (page === 1) {
                setSessions(newSessions);
            } else {
                setSessions((prev) => [...prev, ...newSessions]);
            }

            setHasMoreSessions(newSessions.length === limit);
            setSessionsPage(page);
        } catch (error) {
            console.error('[ProfileScreen] Failed to fetch sessions:', error);
            setSessionsError('Failed to load recent activity');
        } finally {
            setSessionsLoading(false);
        }
    };

    const fetchUserLists = async () => {
        if (!token) return;

        try {
            setListsLoading(true);
            setListsError(null);

            const allLists = await listApi.getUserLists(token);
            setLists(allLists);

            // Auto-select "Want to Read" list as default
            const wantToReadList = allLists.find(
                (l) => l.listType === ListType.WANT_TO_READ
            );

            if (wantToReadList) {
                await selectList(wantToReadList.id);
            } else if (allLists.length > 0) {
                // Fallback to first list if no Want to Read list exists
                await selectList(allLists[0].id);
            }
        } catch (error) {
            console.error('[ProfileScreen] Failed to fetch lists:', error);
            setListsError('Failed to load lists');
        } finally {
            setListsLoading(false);
        }
    };

    const selectList = async (listId: number) => {
        if (!token) return;

        try {
            setSelectedListId(listId);
            setBooksLoading(true);

            // Fetch list with books
            const listWithBooks = await listApi.getList(listId, true, token);
            setSelectedListBooks(listWithBooks.books || []);
        } catch (error) {
            console.error('[ProfileScreen] Failed to fetch list books:', error);
            setSelectedListBooks([]);
        } finally {
            setBooksLoading(false);
        }
    };

    const handleLoadMoreSessions = () => {
        if (!sessionsLoading && hasMoreSessions) {
            fetchRecentSessions(sessionsPage + 1);
        }
    };

    const handleBookPress = (bookId: string) => {
        router.push(`/books/${bookId}`);
    };

    const handleSessionPress = (session: ReadingSessionDTO) => {
        router.push(`/books/${session.bookId}`);
    };

    const handleFriendsPress = () => {
        // TODO: Navigate to friends list screen
        console.log('Friends pressed');
    };

    // Transform BookSummaryDTO to BookCard format
    const transformBookToCardData = (book: BookSummaryDTO) => ({
        id: book.id.toString(),
        title: book.title,
        author: book.authorNames.join(', '),
        isbn: book.isbn10,
        coverUrl: book.coverUrl,
    });

    const viewOptions: SegmentedControlOption[] = [
        { value: 'activity', label: 'Activity' },
        { value: 'lists', label: 'Lists' },
    ];

    const listOptions: SegmentedControlOption[] = lists.map((list) => ({
        value: list.id.toString(),
        label: list.name,
    }));

    if (!user) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        Please log in to view your profile
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
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <UserPhotoPlaceholder username={user.username} size={80} />
                    <Text
                        style={[
                            styles.username,
                            { color: colors.text, fontFamily: Fonts.serif },
                        ]}
                    >
                        {user.username}
                    </Text>
                    <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
                        Member since 2024
                    </Text>

                    {/* Friends Count */}
                    <TouchableOpacity
                        style={styles.friendsCount}
                        onPress={handleFriendsPress}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.friendsNumber, { color: colors.primary }]}>
                            {friendsCount}
                        </Text>
                        <Text style={[styles.friendsLabel, { color: colors.textSecondary }]}>
                            {friendsCount === 1 ? 'Friend' : 'Friends'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* View Selector (Activity / Lists) */}
                <View style={styles.viewSelector}>
                    <SegmentedControl
                        options={viewOptions}
                        selectedValue={currentView}
                        onValueChange={(val) => setCurrentView(val as ProfileView)}
                    />
                </View>

                {/* Activity View */}
                {currentView === 'activity' && (
                    <View style={styles.contentSection}>
                        {sessionsLoading && sessions.length === 0 ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Loading activity...
                                </Text>
                            </View>
                        ) : sessionsError ? (
                            <EmptyState
                                icon="alert-circle-outline"
                                title="Error"
                                message={sessionsError}
                                actionLabel="Retry"
                                onActionPress={() => fetchRecentSessions(1)}
                            />
                        ) : sessions.length === 0 ? (
                            <EmptyState
                                icon="book-outline"
                                title="No Activity Yet"
                                message="Start logging reading sessions to see your activity here"
                            />
                        ) : (
                            <View>
                                {sessions.map((session) => (
                                    <ReadingSessionCard
                                        key={session.id}
                                        session={session}
                                        onPress={() => handleSessionPress(session)}
                                    />
                                ))}

                                {/* Load More Button */}
                                {hasMoreSessions && (
                                    <Button
                                        title={sessionsLoading ? 'Loading...' : 'Load More'}
                                        onPress={handleLoadMoreSessions}
                                        disabled={sessionsLoading}
                                        loading={sessionsLoading}
                                        variant="outlined"
                                        style={styles.loadMoreButton}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Lists View */}
                {currentView === 'lists' && (
                    <View style={styles.contentSection}>
                        {listsLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Loading lists...
                                </Text>
                            </View>
                        ) : listsError ? (
                            <EmptyState
                                icon="alert-circle-outline"
                                title="Error"
                                message={listsError}
                                actionLabel="Retry"
                                onActionPress={fetchUserLists}
                            />
                        ) : lists.length === 0 ? (
                            <EmptyState
                                icon="list-outline"
                                title="No Lists"
                                message="Create your first list to organize your books"
                            />
                        ) : (
                            <>
                                {/* List Toggle Pills */}
                                <View style={styles.listPillsContainer}>
                                    {listOptions.length <= 4 ? (
                                        <SegmentedControl
                                            options={listOptions}
                                            selectedValue={selectedListId?.toString() || ''}
                                            onValueChange={(val) => selectList(parseInt(val))}
                                        />
                                    ) : (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.scrollablePills}
                                        >
                                            <SegmentedControl
                                                options={listOptions}
                                                selectedValue={selectedListId?.toString() || ''}
                                                onValueChange={(val) => selectList(parseInt(val))}
                                            />
                                        </ScrollView>
                                    )}
                                </View>

                                {/* Books Grid */}
                                {booksLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    </View>
                                ) : selectedListBooks.length === 0 ? (
                                    <EmptyState
                                        icon="book-outline"
                                        title="No Books"
                                        message="This list is empty. Add some books to get started!"
                                    />
                                ) : (
                                    <View style={styles.booksGrid}>
                                        {selectedListBooks.map((book) => (
                                            <View key={book.id} style={styles.bookCardWrapper}>
                                                <BookCard
                                                    book={transformBookToCardData(book)}
                                                    onPress={() => handleBookPress(book.id.toString())}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    username: {
        ...Typography.h2,
        marginTop: Spacing.base,
    },
    memberSince: {
        ...Typography.bodySmall,
        marginTop: Spacing.xs,
    },
    friendsCount: {
        marginTop: Spacing.base,
        alignItems: 'center',
    },
    friendsNumber: {
        ...Typography.h2,
        fontSize: 28,
        fontWeight: '700',
    },
    friendsLabel: {
        ...Typography.bodySmall,
        marginTop: Spacing.xs / 2,
    },
    viewSelector: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    contentSection: {
        paddingHorizontal: Spacing.lg,
        minHeight: 400, // Ensures both views take similar space
    },
    loadingContainer: {
        paddingVertical: Spacing.xl,
        alignItems: 'center',
    },
    loadingText: {
        ...Typography.body,
        marginTop: Spacing.md,
    },
    errorText: {
        ...Typography.body,
        textAlign: 'center',
    },
    loadMoreButton: {
        marginTop: Spacing.base,
    },
    listPillsContainer: {
        marginBottom: Spacing.base,
    },
    scrollablePills: {
        paddingRight: Spacing.lg,
    },
    booksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    bookCardWrapper: {
        width: '50%',
        paddingHorizontal: Spacing.xs,
        marginBottom: Spacing.md,
    },
});
