/**
 * API client for communicating with the Tome backend
 */

// API Base URL - update this based on your environment
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP error ${response.status}`,
      }));
      throw new Error(error.message || `Request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
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
 * Book API endpoints
 */
export const bookApi = {
  /**
   * Get all books
   */
  getAllBooks: async (): Promise<BookDTO[]> => {
    return apiRequest<BookDTO[]>('/books');
  },

  /**
   * Get a book by ID
   */
  getBookById: async (id: number): Promise<BookDTO> => {
    return apiRequest<BookDTO>(`/books/${id}`);
  },

  /**
   * Search books by title
   */
  searchBooks: async (title: string): Promise<BookDTO[]> => {
    return apiRequest<BookDTO[]>(`/books/search?title=${encodeURIComponent(title)}`);
  },

  /**
   * Get books by author ID
   */
  getBooksByAuthor: async (authorId: number): Promise<BookDTO[]> => {
    return apiRequest<BookDTO[]>(`/books/by-author/${authorId}`);
  },

  /**
   * Get books by genre ID
   */
  getBooksByGenre: async (genreId: number): Promise<BookDTO[]> => {
    return apiRequest<BookDTO[]>(`/books/by-genre/${genreId}`);
  },

  /**
   * Get book by ISBN-10
   */
  getBookByIsbn10: async (isbn10: string): Promise<BookDTO> => {
    return apiRequest<BookDTO>(`/books/isbn10/${isbn10}`);
  },

  /**
   * Get book by ISBN-13
   */
  getBookByIsbn13: async (isbn13: string): Promise<BookDTO> => {
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
