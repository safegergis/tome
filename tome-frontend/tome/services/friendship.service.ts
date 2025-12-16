import { ENV } from '@/config/env';
import { apiClient } from './api-client';
import type {
  FriendRequestDTO,
  FriendshipDTO,
  PaginatedFriendships,
  PaginatedFriendRequests,
  FriendRequestStatus,
  FriendshipStatus,
  FriendshipStatusResponse,
} from '@/types/friendship';

const FRIENDSHIP_API_URL = `${ENV.USER_DATA_API_URL}/friendships`;

/**
 * Friendship API service
 * Wraps all friendship-related backend endpoints
 */
export const friendshipApi = {
  /**
   * Send a friend request to another user
   * POST /api/friendships/requests
   */
  sendFriendRequest: async (
    friendUserId: number,
    token: string
  ): Promise<FriendRequestDTO> => {
    return apiClient.authenticatedFetch<FriendRequestDTO>(
      `${FRIENDSHIP_API_URL}/requests`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ friendUserId }),
      }
    );
  },

  /**
   * Accept a friend request
   * POST /api/friendships/requests/{id}/accept
   */
  acceptFriendRequest: async (
    requestId: number,
    token: string
  ): Promise<FriendshipDTO> => {
    return apiClient.authenticatedFetch<FriendshipDTO>(
      `${FRIENDSHIP_API_URL}/requests/${requestId}/accept`,
      token,
      {
        method: 'POST',
      }
    );
  },

  /**
   * Reject a friend request
   * POST /api/friendships/requests/{id}/reject
   */
  rejectFriendRequest: async (
    requestId: number,
    token: string
  ): Promise<void> => {
    return apiClient.authenticatedFetch<void>(
      `${FRIENDSHIP_API_URL}/requests/${requestId}/reject`,
      token,
      {
        method: 'POST',
      }
    );
  },

  /**
   * Cancel an outgoing friend request
   * DELETE /api/friendships/requests/{id}
   */
  cancelFriendRequest: async (
    requestId: number,
    token: string
  ): Promise<void> => {
    return apiClient.authenticatedFetch<void>(
      `${FRIENDSHIP_API_URL}/requests/${requestId}`,
      token,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Get friends list (paginated)
   * GET /api/friendships?page={page}&size={size}
   * GET /api/friendships?userId={userId}&page={page}&size={size}
   *
   * @param token - Authentication token
   * @param page - Page number (0-indexed)
   * @param size - Number of items per page
   * @param userId - Optional user ID to fetch another user's friends
   */
  getFriends: async (
    token: string,
    page: number = 0,
    size: number = 20,
    userId?: number
  ): Promise<PaginatedFriendships> => {
    let url = `${FRIENDSHIP_API_URL}?page=${page}&size=${size}`;
    if (userId) {
      url += `&userId=${userId}`;
    }

    return apiClient.authenticatedFetch<PaginatedFriendships>(url, token);
  },

  /**
   * Get incoming friend requests (paginated)
   * GET /api/friendships/requests/incoming?status={status}&page={page}&size={size}
   */
  getIncomingRequests: async (
    token: string,
    status?: FriendRequestStatus,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedFriendRequests> => {
    const statusParam = status ? `&status=${status.toLowerCase()}` : '';
    return apiClient.authenticatedFetch<PaginatedFriendRequests>(
      `${FRIENDSHIP_API_URL}/requests/incoming?page=${page}&size=${size}${statusParam}`,
      token
    );
  },

  /**
   * Get outgoing friend requests (paginated)
   * GET /api/friendships/requests/outgoing?status={status}&page={page}&size={size}
   */
  getOutgoingRequests: async (
    token: string,
    status?: FriendRequestStatus,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedFriendRequests> => {
    const statusParam = status ? `&status=${status.toLowerCase()}` : '';
    return apiClient.authenticatedFetch<PaginatedFriendRequests>(
      `${FRIENDSHIP_API_URL}/requests/outgoing?page=${page}&size=${size}${statusParam}`,
      token
    );
  },

  /**
   * Unfriend a user
   * DELETE /api/friendships/{friendId}
   */
  unfriend: async (friendId: number, token: string): Promise<void> => {
    return apiClient.authenticatedFetch<void>(
      `${FRIENDSHIP_API_URL}/${friendId}`,
      token,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Helper: Get friendship status between current user and another user
   * Client-side logic checking outgoing/incoming requests and friendships
   */
  getFriendshipStatus: async (
    userId: number,
    token: string
  ): Promise<FriendshipStatusResponse> => {
    try {
      // Check for outgoing requests
      const outgoing = await friendshipApi.getOutgoingRequests(
        token,
        'PENDING',
        0,
        1
      );
      const outgoingRequest = outgoing.content.find(
        (req) => req.addresseeId === userId
      );
      if (outgoingRequest) {
        return {
          status: 'pending_sent',
          friendRequestId: outgoingRequest.id,
        };
      }

      // Check for incoming requests
      const incoming = await friendshipApi.getIncomingRequests(
        token,
        'PENDING',
        0,
        1
      );
      const incomingRequest = incoming.content.find(
        (req) => req.requesterId === userId
      );
      if (incomingRequest) {
        return {
          status: 'pending_received',
          friendRequestId: incomingRequest.id,
        };
      }

      // Check if already friends
      const friends = await friendshipApi.getFriends(token, 0, 100);
      const friendship = friends.content.find(
        (f) => f.friendId === userId
      );
      if (friendship) {
        return {
          status: 'friends',
          friendshipId: friendship.id,
        };
      }

      // No relationship found
      return { status: 'none' };
    } catch (error) {
      console.error('[Friendship] Error getting friendship status:', error);
      return { status: 'none' };
    }
  },

  /**
   * Helper: Get count of pending incoming friend requests
   * Used for badge display
   */
  getPendingRequestCount: async (token: string): Promise<number> => {
    try {
      const result = await friendshipApi.getIncomingRequests(
        token,
        'PENDING',
        0,
        1
      );
      return result.totalElements;
    } catch (error) {
      console.error(
        '[Friendship] Error getting pending request count:',
        error
      );
      return 0;
    }
  },

  /**
   * Helper: Get total friends count
   * Used for profile display
   */
  getFriendsCount: async (token: string): Promise<number> => {
    try {
      const result = await friendshipApi.getFriends(token, 0, 1);
      return result.totalElements;
    } catch (error) {
      console.error('[Friendship] Error getting friends count:', error);
      return 0;
    }
  },
};
