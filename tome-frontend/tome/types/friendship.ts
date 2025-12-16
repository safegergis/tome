/**
 * User summary for friendship displays
 * Matches backend UserSummaryDTO
 */
export interface UserSummaryDTO {
  id: number;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

/**
 * Friend request status
 */
export type FriendRequestStatus = 'PENDING' | 'REJECTED';

/**
 * Friend request DTO from backend
 */
export interface FriendRequestDTO {
  id: number;
  requesterId: number;
  requester: UserSummaryDTO;
  addresseeId: number;
  addressee: UserSummaryDTO;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Friendship DTO from backend
 */
export interface FriendshipDTO {
  id: number;
  userId: number;
  friendId: number;
  friend: UserSummaryDTO;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated friendship response (Spring Boot format)
 */
export interface PaginatedFriendships {
  content: FriendshipDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * Paginated friend requests response (Spring Boot format)
 */
export interface PaginatedFriendRequests {
  content: FriendRequestDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * Client-side friendship status for UI state
 */
export type FriendshipStatus =
  | 'none'              // Not friends, no request exists
  | 'pending_sent'      // Current user sent request to this user
  | 'pending_received'  // This user sent request to current user
  | 'friends';          // Already friends

/**
 * Friendship status response with metadata
 */
export interface FriendshipStatusResponse {
  status: FriendshipStatus;
  friendRequestId?: number;  // ID of the friend request if pending
  friendshipId?: number;      // ID of the friendship if friends
}
