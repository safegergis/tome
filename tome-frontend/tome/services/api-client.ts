/**
 * Centralized API client with automatic JWT token expiration handling
 *
 * This module provides a singleton API client that intercepts 401 Unauthorized
 * responses and triggers automatic logout, providing a seamless user experience
 * when JWT tokens expire.
 */

type LogoutCallback = () => Promise<void>;

/**
 * Custom error class for token expiration
 * Thrown when a 401 Unauthorized response is received
 */
export class TokenExpiredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TokenExpiredError';
    }
}

/**
 * Centralized API client for making authenticated and public HTTP requests
 */
class ApiClient {
    private logoutCallback: LogoutCallback | null = null;

    /**
     * Register a logout callback from AuthContext
     * This allows the API client to trigger logout when tokens expire
     *
     * @param callback - Async function to call when 401 is detected
     */
    setLogoutCallback(callback: LogoutCallback): void {
        this.logoutCallback = callback;
    }

    /**
     * Make an authenticated fetch request with automatic 401 handling
     *
     * @template T - Expected response type
     * @param url - The endpoint URL
     * @param token - JWT authentication token
     * @param options - Additional fetch options (method, body, headers, etc.)
     * @returns Promise resolving to the typed response data
     * @throws {TokenExpiredError} When the JWT token has expired (401 response)
     * @throws {Error} For other HTTP errors
     *
     * @example
     * ```typescript
     * const books = await apiClient.authenticatedFetch<Book[]>(
     *   'https://api.example.com/books',
     *   userToken,
     *   { method: 'GET' }
     * );
     * ```
     */
    async authenticatedFetch<T>(
        url: string,
        token: string,
        options?: RequestInit
    ): Promise<T> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...options?.headers,
                },
            });

            // Handle 401 Unauthorized - token expired
            if (response.status === 403) {
                console.warn('[ApiClient] 401 Unauthorized - Token expired');

                // Trigger logout callback if registered
                if (this.logoutCallback) {
                    await this.logoutCallback();
                }

                throw new TokenExpiredError('Your session has expired. Please log in again.');
            }

            // Handle other HTTP errors
            if (!response.ok) {
                let errorMessage = `Request failed: ${response.statusText}`;

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // If response body is not JSON, use default message
                }

                throw new Error(errorMessage);
            }

            // Parse and return successful response
            return response.json() as Promise<T>;
        } catch (error) {
            // Re-throw TokenExpiredError and other errors
            if (error instanceof TokenExpiredError) {
                throw error;
            }

            // Re-throw or wrap other errors
            if (error instanceof Error) {
                throw error;
            }

            throw new Error('An unexpected error occurred');
        }
    }

    /**
     * Make a public (non-authenticated) fetch request
     *
     * @template T - Expected response type
     * @param url - The endpoint URL
     * @param options - Additional fetch options (method, body, headers, etc.)
     * @returns Promise resolving to the typed response data
     * @throws {Error} For HTTP errors
     *
     * @example
     * ```typescript
     * const data = await apiClient.publicFetch<LoginResponse>(
     *   'https://api.example.com/auth/login',
     *   { method: 'POST', body: JSON.stringify(credentials) }
     * );
     * ```
     */
    async publicFetch<T>(
        url: string,
        options?: RequestInit
    ): Promise<T> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });

            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = `Request failed: ${response.statusText}`;

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // If response body is not JSON, use default message
                }

                throw new Error(errorMessage);
            }

            // Parse and return successful response
            return response.json() as Promise<T>;
        } catch (error) {
            // Re-throw or wrap errors
            if (error instanceof Error) {
                throw error;
            }

            throw new Error('An unexpected error occurred');
        }
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
