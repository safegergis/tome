import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityFeedItem, ActivityType } from '@/types/activity';
import { ReadingSessionCard } from './reading-session-card';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ActivityCardProps {
    activity: ActivityFeedItem;
    onPress?: (id: number) => void;
    style?: ViewStyle;
}

// Format timestamp as relative time
function formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    }
}

// Activity header showing user info and action
interface ActivityHeaderProps {
    user: ActivityFeedItem['user'];
    timestamp: string;
    action: string;
    onUserPress?: () => void;
}

function ActivityHeader({ user, timestamp, action, onUserPress }: ActivityHeaderProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity
            style={styles.header}
            onPress={onUserPress}
            activeOpacity={0.7}
            disabled={!onUserPress}
        >
            <View style={[styles.avatar, { backgroundColor: colors.backgroundAlt }]}>
                {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                        {user.username.charAt(0).toUpperCase()}
                    </Text>
                )}
            </View>
            <View style={styles.headerText}>
                <View style={styles.headerRow}>
                    <Text style={[styles.username, { color: colors.text, fontFamily: Fonts.sans }]}>
                        {user.username}
                    </Text>
                    <Text style={[styles.action, { color: colors.textSecondary, fontFamily: Fonts.serif }]}>
                        {' '}
                        {action}
                    </Text>
                </View>
                <Text style={[styles.timestamp, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                    {formatRelativeTime(timestamp)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export function ActivityCard({ activity, onPress, style }: ActivityCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const handleUserPress = () => {
        router.push(`/users/${activity.user.userId}` as any);
    };

    // Reading Session Activity
    if (activity.type === ActivityType.READING_SESSION && activity.readingSession) {
        return (
            <View style={[styles.activityContainer, style]}>
                <ActivityHeader
                    user={activity.user}
                    timestamp={activity.timestamp}
                    action="logged a reading session"
                />
                <ReadingSessionCard
                    session={activity.readingSession}
                    onPress={() => onPress?.(activity.readingSession!.bookId)}
                    style={styles.nestedCard}
                />
            </View>
        );
    }

    // List Created Activity
    if (activity.type === ActivityType.LIST_CREATED && activity.list) {
        const list = activity.list;

        return (
            <View style={[styles.activityContainer, style]}>
                <ActivityHeader
                    user={activity.user}
                    timestamp={activity.timestamp}
                    action="created a list"
                    onUserPress={handleUserPress}
                />
                <TouchableOpacity
                    style={[
                        styles.card,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => router.push(`/lists/${list.id}` as any)}
                    activeOpacity={0.7}
                >
                    <View style={styles.listContent}>
                        <Ionicons name="list-outline" size={20} color={colors.primary} />
                        <View style={styles.listInfo}>
                            <Text style={[styles.listName, { color: colors.text, fontFamily: Fonts.serif }]}>
                                {list.name}
                            </Text>
                            {list.description && (
                                <Text
                                    style={[styles.listDescription, { color: colors.textSecondary, fontFamily: Fonts.serif }]}
                                    numberOfLines={2}
                                >
                                    {list.description}
                                </Text>
                            )}
                            <Text style={[styles.listMeta, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                                {list.bookCount} {list.bookCount === 1 ? 'book' : 'books'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }

    // Book Finished Activity
    if (activity.type === ActivityType.BOOK_FINISHED && activity.userBook) {
        const { book } = activity.userBook;
        const coverUrl = book.isbn10
            ? `https://covers.openlibrary.org/b/isbn/${book.isbn10}-M.jpg`
            : null;

        return (
            <View style={[styles.activityContainer, style]}>
                <ActivityHeader
                    user={activity.user}
                    timestamp={activity.timestamp}
                    action="finished reading"
                    onUserPress={handleUserPress}
                />
                <TouchableOpacity
                    style={[
                        styles.card,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => onPress?.(book.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.bookContent}>
                        <View style={styles.coverContainer}>
                            {coverUrl ? (
                                <Image source={{ uri: coverUrl }} style={styles.cover} />
                            ) : (
                                <View style={[styles.coverPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                                    <Text style={[styles.coverPlaceholderText, { color: colors.textSecondary }]}>
                                        {book.title.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.bookInfo}>
                            <Text
                                style={[styles.bookTitle, { color: colors.text, fontFamily: Fonts.serif }]}
                                numberOfLines={2}
                            >
                                {book.title}
                            </Text>
                            <Text style={[styles.bookAuthor, { color: colors.textSecondary, fontFamily: Fonts.serif }]} numberOfLines={1}>
                                by {book.authorNames?.join(', ') || 'Unknown Author'}
                            </Text>
                            <View style={styles.finishedBadge}>
                                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                <Text style={[styles.finishedText, { color: colors.success, fontFamily: Fonts.sans }]}>Finished</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    activityContainer: {
        marginBottom: Spacing.base,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
        paddingHorizontal: Spacing.lg,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    avatarImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
    },
    headerText: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
    },
    username: {
        fontSize: 14,
        fontWeight: '600',
    },
    action: {
        fontSize: 14,
        fontFamily: Fonts.serif,
    },
    timestamp: {
        ...Typography.caption,
        fontSize: 11,
        marginTop: 1,
    },
    nestedCard: {
        marginHorizontal: Spacing.lg,
    },
    card: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        ...Shadows.sm,
    },
    listContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    listName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 3,
    },
    listDescription: {
        ...Typography.bodySmall,
        fontSize: 13,
        marginBottom: Spacing.xs / 2,
    },
    listMeta: {
        ...Typography.caption,
        fontSize: 11,
    },
    bookContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    coverContainer: {
        marginRight: Spacing.md,
    },
    cover: {
        width: 50,
        height: 75,
        borderRadius: BorderRadius.sm,
    },
    coverPlaceholder: {
        width: 50,
        height: 75,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverPlaceholderText: {
        fontSize: 24,
        fontWeight: '700',
    },
    bookInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    bookTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 3,
    },
    bookAuthor: {
        ...Typography.bodySmall,
        fontSize: 13,
        marginBottom: Spacing.xs,
    },
    finishedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    finishedText: {
        fontSize: 12,
        marginLeft: Spacing.xs / 2,
        fontWeight: '600',
    },
});
