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
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Fonts, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { SegmentedControl, SegmentedControlOption } from '@/components/ui/segmented-control';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { FriendRequestCard } from '@/components/ui/friend-request-card';
import { friendshipApi } from '@/services/friendship.service';
import type { FriendRequestDTO } from '@/types/friendship';

type RequestTab = 'incoming' | 'outgoing';

export default function FriendRequestsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();

  // Tab state
  const [currentTab, setCurrentTab] = useState<RequestTab>('incoming');

  // Incoming requests state
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestDTO[]>([]);
  const [incomingLoading, setIncomingLoading] = useState(true);
  const [incomingRefreshing, setIncomingRefreshing] = useState(false);
  const [incomingError, setIncomingError] = useState<string | null>(null);
  const [incomingPage, setIncomingPage] = useState(0);
  const [incomingHasMore, setIncomingHasMore] = useState(true);

  // Outgoing requests state
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestDTO[]>([]);
  const [outgoingLoading, setOutgoingLoading] = useState(true);
  const [outgoingRefreshing, setOutgoingRefreshing] = useState(false);
  const [outgoingError, setOutgoingError] = useState<string | null>(null);
  const [outgoingPage, setOutgoingPage] = useState(0);
  const [outgoingHasMore, setOutgoingHasMore] = useState(true);

  // Refresh data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchIncomingRequests(0, false);
        fetchOutgoingRequests(0, false);
      }
    }, [token])
  );

  const fetchIncomingRequests = async (page: number, append: boolean = false) => {
    if (!token) return;

    try {
      if (append) {
        setIncomingLoading(true);
      } else {
        setIncomingRefreshing(true);
      }
      setIncomingError(null);

      const result = await friendshipApi.getIncomingRequests(token, 'PENDING', page, 20);

      if (append) {
        setIncomingRequests((prev) => [...prev, ...result.content]);
      } else {
        setIncomingRequests(result.content);
      }

      setIncomingPage(page);
      setIncomingHasMore(!result.last);
    } catch (error) {
      console.error('[FriendRequestsScreen] Failed to fetch incoming requests:', error);
      setIncomingError('Failed to load incoming requests');
    } finally {
      setIncomingLoading(false);
      setIncomingRefreshing(false);
    }
  };

  const fetchOutgoingRequests = async (page: number, append: boolean = false) => {
    if (!token) return;

    try {
      if (append) {
        setOutgoingLoading(true);
      } else {
        setOutgoingRefreshing(true);
      }
      setOutgoingError(null);

      const result = await friendshipApi.getOutgoingRequests(token, 'PENDING', page, 20);

      if (append) {
        setOutgoingRequests((prev) => [...prev, ...result.content]);
      } else {
        setOutgoingRequests(result.content);
      }

      setOutgoingPage(page);
      setOutgoingHasMore(!result.last);
    } catch (error) {
      console.error('[FriendRequestsScreen] Failed to fetch outgoing requests:', error);
      setOutgoingError('Failed to load outgoing requests');
    } finally {
      setOutgoingLoading(false);
      setOutgoingRefreshing(false);
    }
  };

  const handleIncomingRefresh = () => {
    fetchIncomingRequests(0, false);
  };

  const handleOutgoingRefresh = () => {
    fetchOutgoingRequests(0, false);
  };

  const handleIncomingLoadMore = () => {
    if (!incomingLoading && incomingHasMore) {
      fetchIncomingRequests(incomingPage + 1, true);
    }
  };

  const handleOutgoingLoadMore = () => {
    if (!outgoingLoading && outgoingHasMore) {
      fetchOutgoingRequests(outgoingPage + 1, true);
    }
  };

  const handleRequestHandled = () => {
    // Refresh both tabs when a request is handled
    fetchIncomingRequests(0, false);
    fetchOutgoingRequests(0, false);
  };

  const tabOptions: SegmentedControlOption[] = [
    { value: 'incoming', label: 'Incoming' },
    { value: 'outgoing', label: 'Outgoing' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header with back button */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
          Friend Requests
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <SegmentedControl
          options={tabOptions}
          selectedValue={currentTab}
          onValueChange={(val) => setCurrentTab(val as RequestTab)}
        />
      </View>

      {/* Incoming Requests Tab */}
      {currentTab === 'incoming' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={incomingRefreshing}
              onRefresh={handleIncomingRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {incomingLoading && incomingRequests.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading incoming requests...
              </Text>
            </View>
          ) : incomingError && incomingRequests.length === 0 ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Error"
              message={incomingError}
              actionLabel="Retry"
              onActionPress={() => fetchIncomingRequests(0, false)}
            />
          ) : incomingRequests.length === 0 ? (
            <EmptyState
              icon="mail-outline"
              title="No Pending Requests"
              message="You don't have any incoming friend requests"
            />
          ) : (
            <View>
              {incomingRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  type="incoming"
                  onRequestHandled={handleRequestHandled}
                />
              ))}

              {/* Load More Button */}
              {incomingHasMore && (
                <Button
                  title={incomingLoading ? 'Loading...' : 'Load More'}
                  onPress={handleIncomingLoadMore}
                  disabled={incomingLoading}
                  loading={incomingLoading}
                  variant="outlined"
                  style={styles.loadMoreButton}
                />
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Outgoing Requests Tab */}
      {currentTab === 'outgoing' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={outgoingRefreshing}
              onRefresh={handleOutgoingRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {outgoingLoading && outgoingRequests.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading outgoing requests...
              </Text>
            </View>
          ) : outgoingError && outgoingRequests.length === 0 ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Error"
              message={outgoingError}
              actionLabel="Retry"
              onActionPress={() => fetchOutgoingRequests(0, false)}
            />
          ) : outgoingRequests.length === 0 ? (
            <EmptyState
              icon="paper-plane-outline"
              title="No Sent Requests"
              message="You haven't sent any friend requests"
            />
          ) : (
            <View>
              {outgoingRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  type="outgoing"
                  onRequestHandled={handleRequestHandled}
                />
              ))}

              {/* Load More Button */}
              {outgoingHasMore && (
                <Button
                  title={outgoingLoading ? 'Loading...' : 'Load More'}
                  onPress={handleOutgoingLoadMore}
                  disabled={outgoingLoading}
                  loading={outgoingLoading}
                  variant="outlined"
                  style={styles.loadMoreButton}
                />
              )}
            </View>
          )}
        </ScrollView>
      )}
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
  tabSelector: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  loadMoreButton: {
    marginTop: Spacing.md,
  },
});
