/**
 * Reading Session types matching the tome-user-data API
 */

/**
 * Reading method enum
 */
export enum ReadingMethod {
    PHYSICAL = 'PHYSICAL',
    EBOOK = 'EBOOK',
    AUDIOBOOK = 'AUDIOBOOK'
}

/**
 * Request payload for creating a reading session
 */
export interface ReadingSessionRequest {
    bookId: number;
    readingMethod: ReadingMethod;
    minutesRead?: number;      // Required for AUDIOBOOK
    pagesRead?: number;        // Required for PHYSICAL/EBOOK
    startPage?: number;
    endPage?: number;
    sessionDate?: string;      // ISO 8601 format (YYYY-MM-DD)
    notes?: string;
}

/**
 * Response from creating a reading session
 */
export interface ReadingSessionResponse {
    id: number;
    bookId: number;
    userId: number;
    readingMethod: ReadingMethod;
    minutesRead?: number;
    pagesRead?: number;
    startPage?: number;
    endPage?: number;
    sessionDate: string;
    notes?: string;
    createdAt: string;
}

/**
 * User's book with reading status and progress
 */
export interface UserBookDTO {
    id: number;
    bookId: number;
    book: {
        id: number;
        title: string;
        isbn10: string;
        isbn13: string;
        coverUrl?: string;
        authorNames: string[];
        // Book default values for pre-filling
        pageCount?: number;
        ebookPageCount?: number;
        audioLengthSeconds?: number;
    };
    status: 'currently-reading' | 'want-to-read' | 'read' | 'did-not-finish';
    currentPage?: number;
    currentSeconds?: number;
    progressPercentage?: number;

    // User overrides
    userPageCount?: number;
    userAudioLengthSeconds?: number;

    // Other backend DTO fields
    personalRating?: number;
    notes?: string;
    startedAt?: string;
    finishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Validation errors for reading session form
 */
export interface ReadingSessionErrors {
    bookId?: string;
    readingMethod?: string;
    minutesRead?: string;
    pagesRead?: string;
    startPage?: string;
    endPage?: string;
    general?: string;
}
