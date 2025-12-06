import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { authService, LoginRequest } from '@/services/auth.service';
import { apiClient } from '@/services/api-client';

// Storage key for auth token
const AUTH_TOKEN_KEY = '@tome_auth_token';
const AUTH_USER_KEY = '@tome_auth_user';

// User interface
export interface User {
    userId: number;
    username: string;
    email: string;
}

// Auth context type
interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state on mount
    useEffect(() => {
        initializeAuth();
    }, []);

    // Register logout callback with API client
    useEffect(() => {
        apiClient.setLogoutCallback(async () => {
            // Show alert to user
            Alert.alert(
                'Session Expired',
                'Your session has expired. Please log in again.',
                [{ text: 'OK' }]
            );

            // Clear auth state
            await clearAuth();
        });
    }, []);

    // Check for existing token and user data on app launch
    const initializeAuth = async () => {
        try {
            setIsLoading(true);
            const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            // Clear any corrupted data
            await clearAuth();
        } finally {
            setIsLoading(false);
        }
    };

    // Login function
    const login = async (email: string, password: string) => {
        try {
            const loginData: LoginRequest = { email, password };
            const response = await authService.login(loginData);

            // Extract user data and token from response
            const userData: User = {
                userId: response.userId,
                username: response.username,
                email: response.email,
            };

            // Store token and user data
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));

            // Update state
            setToken(response.token);
            setUser(userData);
        } catch (error) {
            // Re-throw error so login screen can handle it
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            // Call logout service (placeholder for now)
            await authService.logout();

            // Clear storage and state
            await clearAuth();
        } catch (error) {
            console.error('Logout failed:', error);
            // Clear local state anyway
            await clearAuth();
        }
    };

    // Helper function to clear auth data
    const clearAuth = async () => {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(AUTH_USER_KEY);
        setToken(null);
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
