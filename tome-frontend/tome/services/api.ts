/**
 * API client for communicating with the Tome backend
 */

import { ENV } from '@/config/env';

// API Base URL - loaded from environment configuration
const API_BASE_URL = ENV.CONTENT_API_URL;

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = options?.method || 'GET';

    console.log('[API] Request:', {
        method,
        url,
        headers: options?.headers,
        body: options?.body,
    });

    try {
        const startTime = Date.now();
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        const duration = Date.now() - startTime;

        console.log(`[API] Response (${duration}ms):`, {
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP error ${response.status}`,
            }));
            console.error('[API] Error Response:', {
                method,
                url,
                status: response.status,
                error,
            });
            throw new Error(error.message || `Request failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[API] Success:', {
            method,
            url,
            dataType: Array.isArray(data) ? `Array(${data.length})` : typeof data,
            preview: Array.isArray(data)
                ? `${data.length} items`
                : data.id
                    ? `ID: ${data.id}`
                    : 'Object',
        });

        return data;
    } catch (error) {
        console.error('[API] Request Failed:', {
            method,
            url,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}

/**
 * Book API types (matching backend DTOs)
 */
export interface AuthorDTO {
    id: number;
    name: string;
    bio?: string;
    birthYear?: number;
    deathYear?: number;
    photoUrl?: string;
    externalId?: string;
    externalSource?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GenreDTO {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
}

export interface BookDTO {
    id: number;
    title: string;
    subtitle?: string;
    isbn10?: string;
    isbn13?: string;
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    language?: string;
    description?: string;
    coverUrl?: string;
    externalId?: string;
    externalSource?: string;
    createdAt: string;
    updatedAt: string;
    authors?: AuthorDTO[];
    genres?: GenreDTO[];
}

/**
 * Paginated response wrapper (matches Spring Boot Page<T>)
 */
export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}

/**
 * Search cache for improved performance
 */
const searchCache = new Map<string, { data: PaginatedResponse<BookDTO>, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Book API endpoints
 */
export const bookApi = {
    /**
     * Get all books
     */
    getAllBooks: async (): Promise<BookDTO[]> => {
        console.log('[bookApi] Calling getAllBooks()');
        return apiRequest<BookDTO[]>('/books');
    },

    /**
     * Get a book by ID
     */
    getBookById: async (id: number): Promise<BookDTO> => {
        console.log(`[bookApi] Calling getBookById(${id})`);
        return apiRequest<BookDTO>(`/books/${id}`);
    },

    /**
     * Search books by title or author name with pagination and caching
     * Uses PostgreSQL full-text search on the backend for optimal performance
     *
     * @param query the search query
     * @param page the page number (0-indexed, default: 0)
     * @param size the page size (default: 20)
     * @returns paginated response with books matching the search query
     */
    searchBooks: async (
        query: string,
        page: number = 0,
        size: number = 20
    ): Promise<PaginatedResponse<BookDTO>> => {
        const cacheKey = `${query}:${page}:${size}`;
        const cached = searchCache.get(cacheKey);

        // Check cache first
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[bookApi] Cache hit for searchBooks("${query}", page=${page}, size=${size})`);
            return cached.data;
        }

        console.log(`[bookApi] Calling searchBooks("${query}", page=${page}, size=${size})`);
        const result = await apiRequest<PaginatedResponse<BookDTO>>(
            `/books/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`
        );

        // Store in cache
        searchCache.set(cacheKey, { data: result, timestamp: Date.now() });

        return result;
    },

    /**
     * Get books by author ID
     */
    getBooksByAuthor: async (authorId: number): Promise<BookDTO[]> => {
        console.log(`[bookApi] Calling getBooksByAuthor(${authorId})`);
        return apiRequest<BookDTO[]>(`/books/by-author/${authorId}`);
    },

    /**
     * Get books by genre ID
     */
    getBooksByGenre: async (genreId: number): Promise<BookDTO[]> => {
        console.log(`[bookApi] Calling getBooksByGenre(${genreId})`);
        return apiRequest<BookDTO[]>(`/books/by-genre/${genreId}`);
    },

    /**
     * Get book by ISBN-10
     */
    getBookByIsbn10: async (isbn10: string): Promise<BookDTO> => {
        console.log(`[bookApi] Calling getBookByIsbn10("${isbn10}")`);
        return apiRequest<BookDTO>(`/books/isbn10/${isbn10}`);
    },

    /**
     * Get book by ISBN-13
     */
    getBookByIsbn13: async (isbn13: string): Promise<BookDTO> => {
        console.log(`[bookApi] Calling getBookByIsbn13("${isbn13}")`);
        return apiRequest<BookDTO>(`/books/isbn13/${isbn13}`);
    },
};

/**
 * Author API endpoints
 */
export const authorApi = {
    /**
     * Get all authors
     */
    getAllAuthors: async (): Promise<AuthorDTO[]> => {
        return apiRequest<AuthorDTO[]>('/authors');
    },

    /**
     * Get an author by ID
     */
    getAuthorById: async (id: number): Promise<AuthorDTO> => {
        return apiRequest<AuthorDTO>(`/authors/${id}`);
    },

    /**
     * Search authors by name
     */
    searchAuthors: async (name: string): Promise<AuthorDTO[]> => {
        return apiRequest<AuthorDTO[]>(`/authors/search?name=${encodeURIComponent(name)}`);
    },

    /**
     * Get authors for a specific book
     */
    getAuthorsByBook: async (bookId: number): Promise<AuthorDTO[]> => {
        return apiRequest<AuthorDTO[]>(`/authors/by-book/${bookId}`);
    },
};

/**
 * Genre API endpoints
 */
export const genreApi = {
    /**
     * Get all genres (alphabetically sorted)
     */
    getAllGenres: async (): Promise<GenreDTO[]> => {
        return apiRequest<GenreDTO[]>('/genres');
    },

    /**
     * Get a genre by ID
     */
    getGenreById: async (id: number): Promise<GenreDTO> => {
        return apiRequest<GenreDTO>(`/genres/${id}`);
    },

    /**
     * Search genres by name
     */
    searchGenres: async (name: string): Promise<GenreDTO[]> => {
        return apiRequest<GenreDTO[]>(`/genres/search?name=${encodeURIComponent(name)}`);
    },

    /**
     * Get genres for a specific book
     */
    getGenresByBook: async (bookId: number): Promise<GenreDTO[]> => {
        return apiRequest<GenreDTO[]>(`/genres/by-book/${bookId}`);
    },
};

