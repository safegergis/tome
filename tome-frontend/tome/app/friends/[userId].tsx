import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/ui/user-card';
import { friendshipApi } from '@/services/friendship.service';
import type { FriendshipDTO } from '@/types/friendship';

export default function FriendsListScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user: currentUser, token } = useAuth();

  // Determine target user ID (use current user if not provided)
  const targetUserId = userId ? parseInt(userId as string, 10) : currentUser?.id;
  const isOwnFriendsList = targetUserId === currentUser?.id;

  // Friends state
  const [friends, setFriends] = useState<FriendshipDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Refresh data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (token && targetUserId) {
        fetchFriends(0, false);
      }
    }, [token, targetUserId])
  );

  const fetchFriends = async (pageNum: number, append: boolean = false) => {
    if (!token || !targetUserId) return;

    try {
      if (append) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Fetch friends for the target user (own friends or another user's friends)
      const result = isOwnFriendsList
        ? await friendshipApi.getFriends(token, pageNum, 20)
        : await friendshipApi.getFriends(token, pageNum, 20, targetUserId);

      if (append) {
        setFriends((prev) => [...prev, ...result.content]);
      } else {
        setFriends(result.content);
      }

      setPage(pageNum);
      setHasMore(!result.last);
    } catch (error) {
      console.error('[FriendsListScreen] Failed to fetch friends:', error);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchFriends(0, false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchFriends(page + 1, true);
    }
  };

  const handleFriendPress = (friendId: number) => {
    router.push(`/users/${friendId}`);
  };

  // Show loading state on initial load
  if (loading && friends.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

        {/* Header with back button */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
            Friends
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading friends...
          </Text>
        </View>
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
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
          Friends {friends.length > 0 && `(${friends.length})`}
        </Text>
        <View style={styles.headerRight} />
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
        {error && friends.length === 0 ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error"
            message={error}
            actionLabel="Retry"
            onActionPress={() => fetchFriends(0, false)}
          />
        ) : friends.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Friends Yet"
            message={
              isOwnFriendsList
                ? 'Start adding friends to see them here'
                : 'This user has no friends yet'
            }
          />
        ) : (
          <View>
            {friends.map((friendship) => (
              <UserCard
                key={friendship.id}
                user={friendship.friend}
                onPress={() => handleFriendPress(friendship.friend.id)}
                style={styles.userCard}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <Button
                title={loading ? 'Loading...' : 'Load More'}
                onPress={handleLoadMore}
                disabled={loading}
                loading={loading}
                variant="outlined"
                style={styles.loadMoreButton}
              />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  userCard: {
    marginBottom: Spacing.md,
  },
  loadMoreButton: {
    marginTop: Spacing.md,
  },
});
