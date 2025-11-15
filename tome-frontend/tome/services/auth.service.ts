/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

// API Base URL - update this based on your environment
const AUTH_API_BASE_URL = 'http://192.168.0.247:8082/api/auth';

/**
 * Generic fetch wrapper with error handling
 */
async function authApiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${AUTH_API_BASE_URL}${endpoint}`;
    const method = options?.method || 'GET';

    console.log('[Auth API] Request:', {
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

        console.log(`[Auth API] Response (${duration}ms):`, {
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
            console.error('[Auth API] Error Response:', {
                method,
                url,
                status: response.status,
                error,
            });
            throw new Error(error.message || `Request failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Auth API] Success:', {
            method,
            url,
            data,
        });

        return data;
    } catch (error) {
        console.error('[Auth API] Request Failed:', {
            method,
            url,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}

/**
 * Authentication API Types
 */
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface RegisterResponse {
    userId: number;
    username: string;
    email: string;
    message: string;
}

export interface VerifyEmailRequest {
    userId: number;
    code: string;
}

export interface VerifyEmailResponse {
    message: string;
}

export interface ResendVerificationRequest {
    email: string;
}

export interface ResendVerificationResponse {
    message: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    userId: number;
    username: string;
    email: string;
    token: string;
    message: string;
}

/**
 * Authentication Service
 */
export const authService = {
    /**
     * Register a new user
     */
    register: async (data: RegisterRequest): Promise<RegisterResponse> => {
        console.log('[authService] Calling register()');
        return authApiRequest<RegisterResponse>('/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Verify email with code
     */
    verifyEmail: async (data: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
        console.log('[authService] Calling verifyEmail()');
        return authApiRequest<VerifyEmailResponse>('/verify-email', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Resend verification code
     */
    resendVerification: async (
        data: ResendVerificationRequest
    ): Promise<ResendVerificationResponse> => {
        console.log('[authService] Calling resendVerification()');
        return authApiRequest<ResendVerificationResponse>('/resend-verification', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Login user (for future implementation)
     */
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        console.log('[authService] Calling login()');
        return authApiRequest<LoginResponse>('/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Logout user (for future implementation)
     */
    logout: async (): Promise<void> => {
        console.log('[authService] Calling logout()');
        // Clear local storage, tokens, etc.
        // For now, just a placeholder
    },
};
