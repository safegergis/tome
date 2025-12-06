/**
 * Reading Session API Service
 * Handles communication with tome-user-data service (port 8083)
 */

import {
    ReadingSessionRequest,
    ReadingSessionResponse,
    ReadingSessionDTO,
    UserBookDTO,
} from '@/types/reading-session';
import { ENV } from '@/config/env';
import { apiClient } from './api-client';

// API Base URL for tome-user-data service - loaded from environment configuration
const READING_SESSION_API_URL = ENV.USER_DATA_API_URL;

/**
 * Reading Session API endpoints
 */
export const readingSessionApi = {
    /**
     * Create a new reading session
     * @param data - Reading session data
     * @param token - JWT authentication token
     * @returns Created reading session
     */
    createSession: async (
        data: ReadingSessionRequest,
        token: string
    ): Promise<ReadingSessionResponse> => {
        console.log('[readingSessionApi] Creating session:', {
            bookId: data.bookId,
            method: data.readingMethod,
        });

        const result = await apiClient.authenticatedFetch<ReadingSessionResponse>(
            `${READING_SESSION_API_URL}/reading-sessions`,
            token,
            {
                method: 'POST',
                body: JSON.stringify(data),
            }
        );

        console.log('[readingSessionApi] Session created successfully:', result.id);
        return result;
    },

    /**
     * Get user's currently reading books
     * @param token - JWT authentication token
     * @returns Array of books with CURRENTLY_READING status
     */
    getCurrentlyReadingBooks: async (token: string): Promise<UserBookDTO[]> => {
        console.log('[readingSessionApi] Fetching currently reading books');

        const result = await apiClient.authenticatedFetch<UserBookDTO[]>(
            `${READING_SESSION_API_URL}/user-books?status=currently-reading`,
            token
        );

        console.log(
            '[readingSessionApi] Fetched',
            result.length,
            'currently reading books'
        );
        return result;
    },

    /**
     * Get recent reading sessions for the user
     * @param token - JWT authentication token
     * @param limit - Number of sessions to fetch (default: 20)
     * @returns Array of reading sessions with enriched book details
     */
    getRecentSessions: async (
        token: string,
        limit: number = 20
    ): Promise<ReadingSessionDTO[]> => {
        console.log('[readingSessionApi] Fetching recent sessions, limit:', limit);

        const result = await apiClient.authenticatedFetch<ReadingSessionDTO[]>(
            `${READING_SESSION_API_URL}/reading-sessions?limit=${limit}`,
            token
        );

        console.log('[readingSessionApi] Fetched', result.length, 'sessions');
        return result;
    },

    /**
     * Search for books (for book picker)
     * @param query - Search query string
     * @param token - JWT authentication token
     * @returns Array of matching books
     */
    searchBooks: async (query: string, token: string): Promise<UserBookDTO[]> => {
        console.log('[readingSessionApi] Searching books:', query);

        // Note: This calls the tome-content service book search endpoint
        const result = await apiClient.authenticatedFetch<any[]>(
            `${ENV.CONTENT_API_URL}/books/search?q=${encodeURIComponent(query)}`,
            token
        );

        console.log('[readingSessionApi] Found', result.length, 'books');

        // Transform BookDTO to UserBookDTO format for consistency
        return result.map((book: any) => ({
            id: 0, // Not a user book yet
            bookId: book.id,
            book: {
                id: book.id,
                title: book.title,
                isbn: book.isbn10,
                coverUrl: book.coverUrl,
                authorNames: book.authors?.map((a: any) => a.name) || [],
                // Include default values for pre-filling page count/audio length
                pageCount: book.pageCount,
                ebookPageCount: book.ebookPageCount,
                audioLengthSeconds: book.audioLengthSeconds,
            },
            status: 'WANT_TO_READ' as const,
        }));
    },
};
