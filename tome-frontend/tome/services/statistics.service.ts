import { apiClient } from './api-client';
import { ENV } from '@/config/env';
import {
    ComprehensiveStatisticsDTO,
    TimeSeriesStatisticsDTO,
    ReadingMethodStatisticsDTO,
    GenreStatisticsDTO,
    AuthorStatisticsDTO,
    ReadingStreakDTO,
    CompletionStatisticsDTO,
    TimePeriod
} from '@/types/statistics';

const USER_DATA_API_URL = ENV.USER_DATA_API_URL;

export const statisticsApi = {
    /**
     * Get comprehensive statistics overview
     */
    getComprehensiveStatistics: async (token: string): Promise<ComprehensiveStatisticsDTO> => {
        console.log('[statisticsApi] Fetching comprehensive statistics');
        const result = await apiClient.authenticatedFetch<ComprehensiveStatisticsDTO>(
            `${USER_DATA_API_URL}/statistics/overview`,
            token
        );
        console.log('[statisticsApi] Comprehensive statistics fetched successfully');
        return result;
    },

    /**
     * Get time series statistics
     */
    getTimeSeriesStatistics: async (
        token: string,
        period: TimePeriod,
        year?: number
    ): Promise<TimeSeriesStatisticsDTO> => {
        console.log(`[statisticsApi] Fetching time series statistics (period: ${period}, year: ${year})`);
        const yearParam = year ? `&year=${year}` : '';
        const result = await apiClient.authenticatedFetch<TimeSeriesStatisticsDTO>(
            `${USER_DATA_API_URL}/statistics/time-series?period=${period}${yearParam}`,
            token
        );
        console.log('[statisticsApi] Time series statistics fetched successfully');
        return result;
    },

    /**
     * Get reading method statistics
     */
    getReadingMethodStatistics: async (token: string): Promise<ReadingMethodStatisticsDTO> => {
        console.log('[statisticsApi] Fetching reading method statistics');
        const result = await apiClient.authenticatedFetch<ReadingMethodStatisticsDTO>(
            `${USER_DATA_API_URL}/statistics/reading-methods`,
            token
        );
        console.log('[statisticsApi] Reading method statistics fetched successfully');
        return result;
    },

    /**
     * Get genre statistics
     */
    getGenreStatistics: async (token: string, limit: number = 10): Promise<GenreStatisticsDTO[]> => {
        console.log(`[statisticsApi] Fetching genre statistics (limit: ${limit})`);
        const result = await apiClient.authenticatedFetch<GenreStatisticsDTO[]>(
            `${USER_DATA_API_URL}/statistics/genres?limit=${limit}`,
            token
        );
        console.log('[statisticsApi] Genre statistics fetched successfully');
        return result;
    },

    /**
     * Get author statistics
     */
    getAuthorStatistics: async (token: string, limit: number = 10): Promise<AuthorStatisticsDTO[]> => {
        console.log(`[statisticsApi] Fetching author statistics (limit: ${limit})`);
        const result = await apiClient.authenticatedFetch<AuthorStatisticsDTO[]>(
            `${USER_DATA_API_URL}/statistics/authors?limit=${limit}`,
            token
        );
        console.log('[statisticsApi] Author statistics fetched successfully');
        return result;
    },

    /**
     * Get reading streak statistics
     */
    getReadingStreak: async (token: string): Promise<ReadingStreakDTO> => {
        console.log('[statisticsApi] Fetching reading streak');
        const result = await apiClient.authenticatedFetch<ReadingStreakDTO>(
            `${USER_DATA_API_URL}/statistics/streaks`,
            token
        );
        console.log('[statisticsApi] Reading streak fetched successfully');
        return result;
    },

    /**
     * Get completion statistics
     */
    getCompletionStatistics: async (token: string): Promise<CompletionStatisticsDTO> => {
        console.log('[statisticsApi] Fetching completion statistics');
        const result = await apiClient.authenticatedFetch<CompletionStatisticsDTO>(
            `${USER_DATA_API_URL}/statistics/completion`,
            token
        );
        console.log('[statisticsApi] Completion statistics fetched successfully');
        return result;
    }
};
