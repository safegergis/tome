import { ENV } from '@/config/env';
import { apiClient } from './api-client';

const AUTH_API_URL = ENV.AUTH_API_URL;

/**
 * User profile DTO
 * Extended user information including friends count
 */
export interface UserProfileDTO {
  id: number;
  username: string;
  email?: string; // Only visible when viewing own profile
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  friendsCount: number;
}

/**
 * User API service
 * Handles user profile data fetching
 */
export const userApi = {
  /**
   * Get user profile by ID
   * GET /api/auth/users/{id}
   *
   * Note: Backend endpoint needs to be implemented
   * Email field will only be included if requesting own profile
   */
  getUserProfile: async (
    userId: number,
    token: string
  ): Promise<UserProfileDTO> => {
    return apiClient.authenticatedFetch<UserProfileDTO>(
      `${AUTH_API_URL}/users/${userId}`,
      token
    );
  },
};
