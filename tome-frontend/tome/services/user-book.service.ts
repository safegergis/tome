/**
 * User Book API Service
 * Handles communication with tome-user-data service for UserBook operations
 */

import { ENV } from '@/config/env';
import { UserBookDTO } from '@/types/reading-session';
import { apiClient } from './api-client';

/**
 * Request payload for updating a user book
 */
export interface UpdateUserBookRequest {
    status?: 'WANT_TO_READ' | 'CURRENTLY_READING' | 'READ' | 'DID_NOT_FINISH';
    currentPage?: number;
    currentSeconds?: number;
    userPageCount?: number;
    userAudioLengthSeconds?: number;
    personalRating?: number;
    notes?: string;
}

/**
 * User Book API endpoints
 */
export const userBookApi = {
    /**
     * Update a user book (including user overrides for page count/audio length)
     * @param userBookId - The UserBook ID
     * @param data - Fields to update
     * @param token - JWT authentication token
     * @returns Updated user book
     */
    updateUserBook: async (
        userBookId: number,
        data: UpdateUserBookRequest,
        token: string
    ): Promise<UserBookDTO> => {
        console.log('[userBookApi] Updating user book:', {
            userBookId,
            fields: Object.keys(data),
        });

        const result = await apiClient.authenticatedFetch<UserBookDTO>(
            `${ENV.USER_DATA_API_URL}/user-books/${userBookId}`,
            token,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            }
        );

        console.log('[userBookApi] User book updated successfully');
        return result;
    },
};
