/**
 * Environment Configuration
 *
 * Centralized access to environment variables with fallback defaults.
 * All environment variables must use the EXPO_PUBLIC_ prefix to be available at runtime.
 */

export const ENV = {
  /**
   * Tome Content Service API URL (Books, Authors, Genres)
   * Default: http://localhost:8080/api
   */
  CONTENT_API_URL: process.env.EXPO_PUBLIC_CONTENT_API_URL || 'http://localhost:8080/api',

  /**
   * Tome Auth Service API URL
   * Default: http://localhost:8082/api/auth
   */
  AUTH_API_URL: process.env.EXPO_PUBLIC_AUTH_API_URL || 'http://localhost:8082/api/auth',

  /**
   * Tome User Data Service API URL (Reading Sessions, User Books, Lists)
   * Default: http://localhost:8083/api
   */
  USER_DATA_API_URL: process.env.EXPO_PUBLIC_USER_DATA_API_URL || 'http://localhost:8083/api',
} as const;

/**
 * Validate that all required environment variables are set
 * Call this on app startup to catch configuration issues early
 */
export function validateEnv() {
  const warnings: string[] = [];

  if (!process.env.EXPO_PUBLIC_CONTENT_API_URL) {
    warnings.push('EXPO_PUBLIC_CONTENT_API_URL not set, using default: ' + ENV.CONTENT_API_URL);
  }

  if (!process.env.EXPO_PUBLIC_AUTH_API_URL) {
    warnings.push('EXPO_PUBLIC_AUTH_API_URL not set, using default: ' + ENV.AUTH_API_URL);
  }

  if (!process.env.EXPO_PUBLIC_USER_DATA_API_URL) {
    warnings.push('EXPO_PUBLIC_USER_DATA_API_URL not set, using default: ' + ENV.USER_DATA_API_URL);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn('  -', warning));
  } else {
    console.log('✅ Environment configuration loaded successfully');
  }
}
