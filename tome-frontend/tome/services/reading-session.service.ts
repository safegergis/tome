/**
 * Reading Session API Service
 * Handles communication with tome-user-data service (port 8083)
 */

import {
    ReadingSessionRequest,
    ReadingSessionResponse,
    UserBookDTO,
} from '@/types/reading-session';
import { ENV } from '@/config/env';

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

        const response = await fetch(
            `${READING_SESSION_API_URL}/reading-sessions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP error ${response.status}`,
            }));
            console.error('[readingSessionApi] Create session failed:', error);
            throw new Error(error.message || 'Failed to create reading session');
        }

        const result = await response.json();
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

        const response = await fetch(
            `${READING_SESSION_API_URL}/user-books?status=currently-reading`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP error ${response.status}`,
            }));
            console.error(
                '[readingSessionApi] Fetch currently reading books failed:',
                error
            );
            throw new Error(error.message || 'Failed to fetch currently reading books');
        }

        const result = await response.json();
        console.log(
            '[readingSessionApi] Fetched',
            result.length,
            'currently reading books'
        );
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
        const response = await fetch(
            `${ENV.CONTENT_API_URL}/books/search?q=${encodeURIComponent(query)}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP error ${response.status}`,
            }));
            console.error('[readingSessionApi] Search books failed:', error);
            throw new Error(error.message || 'Failed to search books');
        }

        const result = await response.json();
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
