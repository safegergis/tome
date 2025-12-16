import React, { useState } from 'react';
import { Alert, useColorScheme } from 'react-native';
import { Button } from './button';
import { useAuth } from '@/context/AuthContext';
import { friendshipApi } from '@/services/friendship.service';
import type { FriendshipStatus } from '@/types/friendship';

interface FriendshipButtonProps {
  userId: number;
  username: string;
  status: FriendshipStatus;
  friendRequestId?: number;
  friendshipId?: number;
  onStatusChange?: () => void;
}

/**
 * Dynamic friendship button that changes based on relationship status
 * Handles: Add Friend, Accept Request, Request Pending, and Friends states
 */
export function FriendshipButton({
  userId,
  username,
  status,
  friendRequestId,
  friendshipId,
  onStatusChange,
}: FriendshipButtonProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  /**
   * Handle sending a friend request
   */
  const handleAddFriend = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await friendshipApi.sendFriendRequest(userId, token);
      setCurrentStatus('pending_sent');
      onStatusChange?.();
      Alert.alert('Success', `Friend request sent to ${username}`);
    } catch (error: any) {
      console.error('[FriendshipButton] Error sending friend request:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send friend request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle accepting a friend request
   */
  const handleAcceptRequest = async () => {
    if (!token || !friendRequestId) return;

    setLoading(true);
    try {
      await friendshipApi.acceptFriendRequest(friendRequestId, token);
      setCurrentStatus('friends');
      onStatusChange?.();
      Alert.alert('Success', `You are now friends with ${username}!`);
    } catch (error: any) {
      console.error('[FriendshipButton] Error accepting friend request:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to accept friend request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle unfriending a user (with confirmation)
   */
  const handleUnfriend = () => {
    Alert.alert(
      'Unfriend User',
      `Are you sure you want to unfriend ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;

            setLoading(true);
            try {
              await friendshipApi.unfriend(userId, token);
              setCurrentStatus('none');
              onStatusChange?.();
              Alert.alert('Success', `You are no longer friends with ${username}`);
            } catch (error: any) {
              console.error('[FriendshipButton] Error unfriending user:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to unfriend user. Please try again.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render different button based on status
  switch (currentStatus) {
    case 'none':
      // No relationship - show "Add Friend" button
      return (
        <Button
          title="Add Friend"
          onPress={handleAddFriend}
          variant="primary"
          loading={loading}
          disabled={loading}
        />
      );

    case 'pending_sent':
      // User sent request - show disabled "Request Pending" button
      return (
        <Button
          title="Request Pending"
          onPress={() => {}}
          variant="outlined"
          disabled={true}
        />
      );

    case 'pending_received':
      // User received request - show "Accept Request" button
      return (
        <Button
          title="Accept Request"
          onPress={handleAcceptRequest}
          variant="primary"
          loading={loading}
          disabled={loading}
        />
      );

    case 'friends':
      // Already friends - show "Friends" button with unfriend option
      return (
        <Button
          title="Friends"
          onPress={handleUnfriend}
          variant="secondary"
          loading={loading}
          disabled={loading}
        />
      );

    default:
      return null;
  }
}
