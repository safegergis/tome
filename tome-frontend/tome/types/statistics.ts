export type ReadingMethod = 'PHYSICAL' | 'EBOOK' | 'AUDIOBOOK';
export type TimePeriod = 'WEEK' | 'MONTH' | 'YEAR';

// Comprehensive Statistics
export interface ComprehensiveStatisticsDTO {
    userId: number;
    summary: SummaryStats;
    methodBreakdown: ReadingMethodBreakdownSummary;
    topGenres: GenreStatSummary[];
    topAuthors: AuthorStatSummary[];
    streak: ReadingStreakInfo;
    completion: CompletionMetrics;
}

export interface SummaryStats {
    totalBooksRead: number;
    totalPagesRead: number;
    totalMinutesRead: number;
    currentlyReadingCount: number;
}

export interface ReadingMethodBreakdownSummary {
    physical: MethodStats;
    ebook: MethodStats;
    audiobook: MethodStats;
    preferredMethod?: ReadingMethod;
}

export interface MethodStats {
    booksCount: number;
    pagesRead: number;
    minutesRead: number;
    sessionsCount: number;
    percentage: number;
}

export interface GenreStatSummary {
    genreId: number;
    genreName: string;
    booksRead: number;
    totalBooks: number;
}

export interface AuthorStatSummary {
    authorId: number;
    authorName: string;
    booksRead: number;
    totalBooks: number;
}

export interface ReadingStreakInfo {
    currentStreak: number;
    longestStreak: number;
}

export interface CompletionMetrics {
    totalStarted: number;
    totalCompleted: number;
    totalDnf: number;
    completionRate: number;
}

// Time Series Statistics
export interface TimeSeriesStatisticsDTO {
    period: TimePeriod;
    dataPoints: TimeSeriesDataPoint[];
}

export interface TimeSeriesDataPoint {
    label: string;
    startDate: string;
    endDate: string;
    pagesRead: number;
    minutesRead: number;
    sessionsCount: number;
}

// Reading Method Statistics
export interface ReadingMethodStatisticsDTO {
    userId: number;
    physical: MethodBreakdown;
    ebook: MethodBreakdown;
    audiobook: MethodBreakdown;
    preferredMethod?: ReadingMethod;
}

export interface MethodBreakdown {
    booksCount: number;
    pagesRead: number;
    minutesRead: number;
    sessionsCount: number;
    percentage: number;
}

// Genre Statistics
export interface GenreStatisticsDTO {
    genreId: number;
    genreName: string;
    booksRead: number;
    booksCurrentlyReading: number;
    booksWantToRead: number;
    totalBooks: number;
    averageRating?: number;
}

// Author Statistics
export interface AuthorStatisticsDTO {
    authorId: number;
    authorName: string;
    booksRead: number;
    booksCurrentlyReading: number;
    booksWantToRead: number;
    totalBooks: number;
    averageRating?: number;
}

// Reading Streak
export interface ReadingStreakDTO {
    currentStreak: number;
    longestStreak: number;
    currentStreakStartDate?: string;
    longestStreakStartDate?: string;
    longestStreakEndDate?: string;
    activeDates: string[];
}

// Completion Statistics
export interface CompletionStatisticsDTO {
    totalStarted: number;
    totalCompleted: number;
    totalDnf: number;
    completionRate: number;
    dnfRate: number;
    dnfReasons: DnfReasonCount[];
    velocity: ReadingVelocity;
}

export interface DnfReasonCount {
    reason: string;
    count: number;
}

export interface ReadingVelocity {
    avgDaysToComplete: number;
    avgPagesPerDay: number;
    avgMinutesPerDay: number;
}
