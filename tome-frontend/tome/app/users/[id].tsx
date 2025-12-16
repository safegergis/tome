import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { UserPhotoPlaceholder } from '@/components/ui/user-photo-placeholder';
import { ReadingSessionCard } from '@/components/ui/reading-session-card';
import { SegmentedControl, SegmentedControlOption } from '@/components/ui/segmented-control';
import { EmptyState } from '@/components/ui/empty-state';
import { BookCard, BookData } from '@/components/ui/book-card';
import { userApi, UserProfileDTO } from '@/services/user.service';
import { friendshipApi } from '@/services/friendship.service';
import { readingSessionApi } from '@/services/reading-session.service';
import { listApi } from '@/services/list.service';
import { userBookApi } from '@/services/user-book.service';
import { ReadingSessionDTO, UserBookDTO } from '@/types/reading-session';
import { ListDTO } from '@/types/list';
import type { FriendshipStatusResponse } from '@/types/friendship';

type ProfileView = 'activity' | 'lists';

export default function UserProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user: currentUser, token } = useAuth();

    const userId = parseInt(id as string, 10);
    const isOwnProfile = currentUser?.id === userId;

    // Profile state
    const [profile, setProfile] = useState<UserProfileDTO | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Friendship state
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatusResponse | null>(null);
    const [friendshipLoading, setFriendshipLoading] = useState(false);

    // View state
    const [currentView, setCurrentView] = useState<ProfileView>('activity');

    // Activity state
    const [sessions, setSessions] = useState<ReadingSessionDTO[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [sessionsError, setSessionsError] = useState<string | null>(null);

    // Lists state
    const [lists, setLists] = useState<ListDTO[]>([]);
    const [listsLoading, setListsLoading] = useState(true);
    const [listsError, setListsError] = useState<string | null>(null);

    // Currently Reading state
    const [currentlyReading, setCurrentlyReading] = useState<UserBookDTO[]>([]);
    const [currentlyReadingLoading, setCurrentlyReadingLoading] = useState(true);
    const [currentlyReadingError, setCurrentlyReadingError] = useState<string | null>(null);

    // Fetch all data on mount
    useEffect(() => {
        if (token && !isNaN(userId)) {
            fetchUserProfile();
            if (!isOwnProfile) {
                fetchFriendshipStatus();
            }
            fetchUserSessions();
            fetchUserLists();
            fetchCurrentlyReading();
        }
    }, [token, userId]);

    const fetchUserProfile = async () => {
        if (!token) return;

        try {
            setProfileLoading(true);
            setProfileError(null);

            const userProfile = await userApi.getUserProfile(userId, token);
            setProfile(userProfile);
        } catch (error) {
            console.error('[UserProfileScreen] Failed to fetch user profile:', error);
            setProfileError('Failed to load user profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchFriendshipStatus = async () => {
        if (!token) return;

        try {
            setFriendshipLoading(true);

            const status = await friendshipApi.getFriendshipStatus(userId, token);
            setFriendshipStatus(status);
        } catch (error) {
            console.error('[UserProfileScreen] Failed to fetch friendship status:', error);
            // Non-critical error, don't show to user
        } finally {
            setFriendshipLoading(false);
        }
    };

    const fetchUserSessions = async () => {
        if (!token) return;

        try {
            setSessionsLoading(true);
            setSessionsError(null);

            const userSessions = await readingSessionApi.getUserSessions(userId, token, 20);
            setSessions(userSessions);
        } catch (error) {
            console.error('[UserProfileScreen] Failed to fetch user sessions:', error);
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

            // Fetch user's lists (own lists or public lists of other users)
            const allLists = isOwnProfile
                ? await listApi.getUserLists(token)
                : await listApi.getUserLists(token, userId);

            setLists(allLists);
        } catch (error) {
            console.error('[UserProfileScreen] Failed to fetch user lists:', error);
            setListsError('Failed to load lists');
        } finally {
            setListsLoading(false);
        }
    };

    const fetchCurrentlyReading = async () => {
        if (!token) return;

        try {
            setCurrentlyReadingLoading(true);
            setCurrentlyReadingError(null);

            // Fetch currently reading books (own books or other user's public currently-reading)
            const books = isOwnProfile
                ? await userBookApi.getUserBooks(token, 'currently-reading')
                : await userBookApi.getUserBooks(token, 'currently-reading', userId);

            setCurrentlyReading(books);
        } catch (error) {
            console.error('[UserProfileScreen] Failed to fetch currently reading:', error);
            setCurrentlyReadingError('Failed to load currently reading books');
        } finally {
            setCurrentlyReadingLoading(false);
        }
    };

    const handleFriendshipChange = () => {
        // Refresh friendship status and profile (for friends count)
        fetchFriendshipStatus();
        fetchUserProfile();
    };

    const handleFriendshipAction = () => {
        if (!friendshipStatus || !token) return;

        const status = friendshipStatus.status;

        switch (status) {
            case 'none':
                // Send friend request
                handleAddFriend();
                break;
            case 'pending_sent':
                // Show info that request is pending
                alert('Friend request pending', `Your friend request to ${profile?.username} is still pending.`);
                break;
            case 'pending_received':
                // Accept friend request
                handleAcceptRequest();
                break;
            case 'friends':
                // Show unfriend option
                handleUnfriendConfirm();
                break;
        }
    };

    const handleAddFriend = async () => {
        if (!token) return;

        setFriendshipLoading(true);
        try {
            await friendshipApi.sendFriendRequest(userId, token);
            alert('Success', `Friend request sent to ${profile?.username}`);
            handleFriendshipChange();
        } catch (error: any) {
            console.error('[UserProfileScreen] Error sending friend request:', error);
            alert('Error', error.message || 'Failed to send friend request. Please try again.');
        } finally {
            setFriendshipLoading(false);
        }
    };

    const handleAcceptRequest = async () => {
        if (!token || !friendshipStatus?.friendRequestId) return;

        setFriendshipLoading(true);
        try {
            await friendshipApi.acceptFriendRequest(friendshipStatus.friendRequestId, token);
            alert('Success', `You are now friends with ${profile?.username}!`);
            handleFriendshipChange();
        } catch (error: any) {
            console.error('[UserProfileScreen] Error accepting friend request:', error);
            alert('Error', error.message || 'Failed to accept friend request. Please try again.');
        } finally {
            setFriendshipLoading(false);
        }
    };

    const performUnfriend = async () => {
        if (!token) return;

        setFriendshipLoading(true);
        try {
            await friendshipApi.unfriend(userId, token);
            alert('Success', `You are no longer friends with ${profile?.username}`);
            handleFriendshipChange();
        } catch (error: any) {
            console.error('[UserProfileScreen] Error unfriending user:', error);
            alert('Error', error.message || 'Failed to unfriend user. Please try again.');
        } finally {
            setFriendshipLoading(false);
        }
    };

    const handleFriendsPress = () => {
        router.push(`/friends/${userId}`);
    };

    const getFriendshipIcon = (status: FriendshipStatusResponse['status'], colors: any) => {
        switch (status) {
            case 'none':
                return <Ionicons name="person-add-outline" size={24} color={colors.primary} />;
            case 'pending_sent':
                return <Ionicons name="hourglass-outline" size={24} color={colors.textSecondary} />;
            case 'pending_received':
                return <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />;
            case 'friends':
                return <Ionicons name="person-remove-outline" size={24} color={colors.primary} />;
            default:
                return null;
        }
    };

    const alert = (title: string, message: string) => {
        Alert.alert(title, message);
    };

    const handleUnfriendConfirm = () => {
        if (!profile) return;

        Alert.alert(
            'Unfriend User',
            `Are you sure you want to unfriend ${profile.username}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Unfriend', style: 'destructive', onPress: () => performUnfriend() }
            ]
        );
    };

    const handleBookPress = (bookId: string) => {
        router.push(`/books/${bookId}`);
    };

    const handleSessionPress = (session: ReadingSessionDTO) => {
        router.push(`/books/${session.bookId}`);
    };

    const handleListPress = (listId: number) => {
        router.push(`/lists/${listId}`);
    };

    const convertUserBookToBookData = (userBook: UserBookDTO): BookData => {
        return {
            id: userBook.book.id.toString(),
            title: userBook.book.title,
            author: userBook.book.authorNames?.join(', ') || 'Unknown Author',
            isbn: userBook.book.isbn13 || userBook.book.isbn10 || '',
            coverUrl: userBook.book.coverUrl,
            progress: userBook.progressPercentage ? Math.round(userBook.progressPercentage) : undefined,
        };
    };

    const viewOptions: SegmentedControlOption[] = [
        { value: 'activity', label: 'Activity' },
        { value: 'lists', label: 'Lists' },
    ];

    // Show loading state while fetching profile
    if (profileLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

                {/* Header with back button */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                    <View style={styles.headerRight} />
                </View>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading profile...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state if profile failed to load
    if (profileError || !profile) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

                {/* Header with back button */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                    <View style={styles.headerRight} />
                </View>

                <EmptyState
                    icon="alert-circle-outline"
                    title="Error"
                    message={profileError || 'User not found'}
                    actionLabel="Go Back"
                    onActionPress={() => router.back()}
                />
            </SafeAreaView>
        );
    }


    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            {/* Header with back button */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    @{profile.username}
                </Text>
                {!isOwnProfile && friendshipStatus ? (
                    <TouchableOpacity
                        style={[styles.friendshipIconButton, { backgroundColor: colors.surface }]}
                        onPress={() => handleFriendshipAction()}
                        activeOpacity={0.7}
                    >
                        {getFriendshipIcon(friendshipStatus.status, colors)}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerRight} />
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <UserPhotoPlaceholder username={profile.username} size={80} />
                    <Text
                        style={[
                            styles.username,
                            { color: colors.text, fontFamily: Fonts.serif },
                        ]}
                    >
                        {profile.username}
                    </Text>
                    {profile.bio && (
                        <Text
                            style={[
                                styles.bio,
                                { color: colors.textSecondary, fontFamily: Fonts.serif },
                            ]}
                        >
                            {profile.bio}
                        </Text>
                    )}

                    {/* Friends Count */}
                    <TouchableOpacity
                        style={styles.friendsCount}
                        onPress={handleFriendsPress}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.friendsNumber, { color: colors.primary }]}>
                            {profile.friendsCount}
                        </Text>
                        <Text style={[styles.friendsLabel, { color: colors.textSecondary }]}>
                            {profile.friendsCount === 1 ? 'Friend' : 'Friends'}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Currently Reading Shelf (only if has books) */}
                {currentlyReading.length > 0 && (
                    <View style={styles.currentlyReadingSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                            Currently Reading
                        </Text>

                        {currentlyReadingLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : currentlyReadingError ? (
                            <View style={styles.errorContainer}>
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {currentlyReadingError}
                                </Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.shelfScrollContent}
                            >
                                {currentlyReading.map((userBook) => (
                                    <BookCard
                                        key={userBook.id}
                                        book={convertUserBookToBookData(userBook)}
                                        onPress={() => handleBookPress(userBook.book.id.toString())}
                                        showProgress={true}
                                        style={styles.shelfBookCard}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

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
                        {sessionsLoading ? (
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
                                onActionPress={fetchUserSessions}
                            />
                        ) : sessions.length === 0 ? (
                            <EmptyState
                                icon="book-outline"
                                title="No Activity Yet"
                                message={
                                    isOwnProfile
                                        ? 'Start logging reading sessions to see your activity here'
                                        : `${profile.username} hasn't logged any reading activity yet`
                                }
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
                                title="No Public Lists"
                                message={
                                    isOwnProfile
                                        ? 'Create your first list to organize your books'
                                        : `${profile.username} hasn't created any public lists yet`
                                }
                            />
                        ) : (
                            <View style={styles.listsContainer}>
                                {lists.map((list) => (
                                    <TouchableOpacity
                                        key={list.id}
                                        style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        onPress={() => handleListPress(list.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.listCardContent}>
                                            <View style={styles.listCardHeader}>
                                                <Text style={[styles.listCardName, { color: colors.text, fontFamily: Fonts.serif }]}>
                                                    {list.name}
                                                </Text>
                                                <View style={styles.listCardMeta}>
                                                    <View style={styles.listCardMetaItem}>
                                                        <Ionicons name="book-outline" size={14} color={colors.textSecondary} />
                                                        <Text style={[styles.listCardMetaText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                                                            {list.bookCount}
                                                        </Text>
                                                    </View>
                                                    {!list.isPublic && (
                                                        <View style={styles.listCardMetaItem}>
                                                            <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                            {list.description && (
                                                <Text
                                                    style={[styles.listCardDescription, { color: colors.textSecondary, fontFamily: Fonts.sans }]}
                                                    numberOfLines={2}
                                                >
                                                    {list.description}
                                                </Text>
                                            )}
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
    },
    headerTitle: {
        ...Typography.h3,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Spacing.md,
    },
    headerRight: {
        width: 40, // Match back button width for centering
    },
    friendshipIconButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
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
    bio: {
        ...Typography.body,
        marginTop: Spacing.sm,
        textAlign: 'center',
        paddingHorizontal: Spacing.md,
    },
    memberSince: {
        ...Typography.bodySmall,
        marginTop: Spacing.xs,
    },
    friendsCount: {
        marginTop: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    friendsNumber: {
        ...Typography.h3,
        fontSize: 24,
        fontWeight: '700',
    },
    friendsLabel: {
        ...Typography.body,
    },
    currentlyReadingSection: {
        paddingVertical: Spacing.lg,
        paddingLeft: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.h3,
        marginBottom: Spacing.md,
        paddingRight: Spacing.lg,
    },
    shelfScrollContent: {
        paddingRight: Spacing.lg,
        gap: Spacing.md,
    },
    shelfBookCard: {
        width: 140,
    },
    errorContainer: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    viewSelector: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    contentSection: {
        paddingHorizontal: Spacing.lg,
        minHeight: 400,
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
    listsContainer: {
        gap: Spacing.md,
    },
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.base,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        ...Shadows.sm,
    },
    listCardContent: {
        flex: 1,
        marginRight: Spacing.md,
    },
    listCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    listCardName: {
        ...Typography.h3,
        fontSize: 18,
        flex: 1,
        marginRight: Spacing.sm,
    },
    listCardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    listCardMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    listCardMetaText: {
        ...Typography.bodySmall,
        fontWeight: '600',
    },
    listCardDescription: {
        ...Typography.bodySmall,
        lineHeight: 18,
    },
});
