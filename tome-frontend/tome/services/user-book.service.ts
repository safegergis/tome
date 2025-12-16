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
 * Request payload for adding a book to shelf
 */
export interface CreateUserBookRequest {
    bookId: number;
    status: 'WANT_TO_READ' | 'CURRENTLY_READING' | 'READ' | 'DID_NOT_FINISH';
}

/**
 * User Book API endpoints
 */
export const userBookApi = {
    /**
     * Get user books by status
     * @param token - JWT authentication token
     * @param status - Optional reading status filter (currently-reading, want-to-read, read, did-not-finish)
     * @param userId - Optional user ID to fetch another user's books (only currently-reading supported for privacy)
     * @returns List of user books
     */
    getUserBooks: async (
        token: string,
        status?: 'currently-reading' | 'want-to-read' | 'read' | 'did-not-finish',
        userId?: number
    ): Promise<UserBookDTO[]> => {
        console.log('[userBookApi] Fetching user books:', { status, userId });

        let url = `${ENV.USER_DATA_API_URL}/user-books`;
        const params = new URLSearchParams();

        if (status) {
            params.append('status', status);
        }
        if (userId) {
            params.append('userId', userId.toString());
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const result = await apiClient.authenticatedFetch<UserBookDTO[]>(url, token);

        console.log('[userBookApi] User books fetched successfully:', result.length);
        return result;
    },

    /**
     * Add a book to user's shelf
     * @param bookId - The Book ID
     * @param status - Initial reading status
     * @param token - JWT authentication token
     * @returns Created user book
     */
    addBookToShelf: async (
        bookId: number,
        status: 'WANT_TO_READ' | 'CURRENTLY_READING' | 'READ' | 'DID_NOT_FINISH',
        token: string
    ): Promise<UserBookDTO> => {
        console.log('[userBookApi] Adding book to shelf:', { bookId, status });

        const result = await apiClient.authenticatedFetch<UserBookDTO>(
            `${ENV.USER_DATA_API_URL}/user-books`,
            token,
            {
                method: 'POST',
                body: JSON.stringify({ bookId, status }),
            }
        );

        console.log('[userBookApi] Book added to shelf successfully');
        return result;
    },

    /**
     * Update reading status of a user book
     * @param userBookId - The UserBook ID
     * @param status - New reading status
     * @param token - JWT authentication token
     * @returns Updated user book
     */
    updateReadingStatus: async (
        userBookId: number,
        status: 'want-to-read' | 'currently-reading' | 'read' | 'did-not-finish',
        token: string
    ): Promise<UserBookDTO> => {
        console.log('[userBookApi] Updating reading status:', { userBookId, status });

        const result = await apiClient.authenticatedFetch<UserBookDTO>(
            `${ENV.USER_DATA_API_URL}/user-books/${userBookId}/status?status=${status}`,
            token,
            {
                method: 'PATCH',
            }
        );

        console.log('[userBookApi] Reading status updated successfully');
        return result;
    },

    /**
     * Mark a book as Did Not Finish
     * @param userBookId - The UserBook ID
     * @param reason - Optional reason for DNF
     * @param token - JWT authentication token
     * @returns Updated user book
     */
    markAsDidNotFinish: async (
        userBookId: number,
        token: string,
        reason?: string
    ): Promise<UserBookDTO> => {
        console.log('[userBookApi] Marking book as DNF:', { userBookId, reason });

        const url = reason
            ? `${ENV.USER_DATA_API_URL}/user-books/${userBookId}/dnf?reason=${encodeURIComponent(reason)}`
            : `${ENV.USER_DATA_API_URL}/user-books/${userBookId}/dnf`;

        const result = await apiClient.authenticatedFetch<UserBookDTO>(url, token, {
            method: 'POST',
        });

        console.log('[userBookApi] Book marked as DNF successfully');
        return result;
    },

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
