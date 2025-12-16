import { ENV } from '@/config/env';
import { apiClient } from './api-client';
import { PaginatedActivityFeed } from '@/types/activity';

const ACTIVITY_FEED_API_URL = `${ENV.USER_DATA_API_URL}/activity-feed`;

/**
 * Activity Feed API Service
 * Handles fetching of friend activity feed
 */
export const activityFeedApi = {
  /**
   * Get activity feed for current user's friends
   * Returns paginated feed of reading sessions, lists created, and books finished
   */
  getActivityFeed: async (
    token: string,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedActivityFeed> => {
    console.log('[activityFeedApi] Fetching feed, page:', page, 'size:', size);

    return apiClient.authenticatedFetch<PaginatedActivityFeed>(
      `${ACTIVITY_FEED_API_URL}?page=${page}&size=${size}`,
      token
    );
  },
};
