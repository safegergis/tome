import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './button';
import { useAuth } from '@/context/AuthContext';
import { friendshipApi } from '@/services/friendship.service';
import type { FriendRequestDTO } from '@/types/friendship';
import { Colors, Typography, BorderRadius, Spacing, Shadows, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FriendRequestCardProps {
  request: FriendRequestDTO;
  type: 'incoming' | 'outgoing';
  onRequestHandled?: () => void;
  style?: ViewStyle;
}

/**
 * Format date as relative time
 * e.g., "2 hours ago", "3 days ago", "Jan 15"
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
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

/**
 * Friend request card component
 * Shows user info, relative time, and action buttons based on request type
 */
export function FriendRequestCard({
  request,
  type,
  onRequestHandled,
  style,
}: FriendRequestCardProps) {
  const router = useRouter();
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Get the user to display (requester for incoming, addressee for outgoing)
  const displayUser = type === 'incoming' ? request.requester : request.addressee;
  const formattedDate = formatRelativeTime(request.createdAt);

  /**
   * Navigate to user profile when tapping user area
   */
  const handleUserPress = () => {
    router.push(`/users/${displayUser.id}`);
  };

  /**
   * Handle accepting a friend request
   */
  const handleAccept = async () => {
    if (!token) return;

    setAcceptLoading(true);
    try {
      await friendshipApi.acceptFriendRequest(request.id, token);
      onRequestHandled?.();
      Alert.alert('Success', `You are now friends with ${displayUser.username}!`);
    } catch (error: any) {
      console.error('[FriendRequestCard] Error accepting request:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to accept friend request. Please try again.'
      );
    } finally {
      setAcceptLoading(false);
    }
  };

  /**
   * Handle rejecting a friend request (with confirmation)
   */
  const handleReject = () => {
    Alert.alert(
      'Reject Friend Request',
      `Are you sure you want to reject the friend request from ${displayUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;

            setRejectLoading(true);
            try {
              await friendshipApi.rejectFriendRequest(request.id, token);
              onRequestHandled?.();
              Alert.alert('Request Rejected', `Friend request from ${displayUser.username} has been rejected.`);
            } catch (error: any) {
              console.error('[FriendRequestCard] Error rejecting request:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to reject friend request. Please try again.'
              );
            } finally {
              setRejectLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle canceling a sent friend request (with confirmation)
   */
  const handleCancel = () => {
    Alert.alert(
      'Cancel Friend Request',
      `Are you sure you want to cancel your friend request to ${displayUser.username}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;

            setCancelLoading(true);
            try {
              await friendshipApi.cancelFriendRequest(request.id, token);
              onRequestHandled?.();
              Alert.alert('Request Canceled', `Your friend request to ${displayUser.username} has been canceled.`);
            } catch (error: any) {
              console.error('[FriendRequestCard] Error canceling request:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to cancel friend request. Please try again.'
              );
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {/* User Info - Tappable */}
      <TouchableOpacity
        style={styles.userSection}
        onPress={handleUserPress}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatarContainer, { backgroundColor: colors.backgroundAlt }]}>
          {displayUser.avatarUrl ? (
            <Image
              source={{ uri: displayUser.avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderAvatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={28} color={colors.textLight} />
            </View>
          )}
        </View>

        {/* User Details */}
        <View style={styles.userDetails}>
          <Text
            style={[
              styles.username,
              { color: colors.text, fontFamily: Fonts.serif },
            ]}
            numberOfLines={1}
          >
            @{displayUser.username}
          </Text>
          {displayUser.bio && (
            <Text
              style={[
                styles.bio,
                { color: colors.textSecondary, fontFamily: Fonts.serif },
              ]}
              numberOfLines={2}
            >
              {displayUser.bio}
            </Text>
          )}
          <Text
            style={[
              styles.date,
              { color: colors.textSecondary },
            ]}
          >
            {formattedDate}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {type === 'incoming' ? (
          // Incoming request: Accept + Reject
          <>
            <Button
              title="Accept"
              onPress={handleAccept}
              variant="primary"
              loading={acceptLoading}
              disabled={acceptLoading || rejectLoading}
              style={styles.actionButton}
            />
            <Button
              title="Reject"
              onPress={handleReject}
              variant="outlined"
              loading={rejectLoading}
              disabled={acceptLoading || rejectLoading}
              style={styles.actionButton}
            />
          </>
        ) : (
          // Outgoing request: Cancel
          <Button
            title="Cancel Request"
            onPress={handleCancel}
            variant="outlined"
            loading={cancelLoading}
            disabled={cancelLoading}
            fullWidth
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  bio: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  date: {
    ...Typography.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
