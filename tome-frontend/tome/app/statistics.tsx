import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { statisticsApi } from '@/services/statistics.service';
import { ComprehensiveStatisticsDTO } from '@/types/statistics';
import { StatCard } from '@/components/statistics/stat-card';
import { StreakCard } from '@/components/statistics/streak-card';
import { CompletionCard } from '@/components/statistics/completion-card';
import { EmptyState } from '@/components/ui/empty-state';

export default function StatisticsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { token } = useAuth();

    const [stats, setStats] = useState<ComprehensiveStatisticsDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (token) {
                fetchStatistics();
            }
        }, [token])
    );

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await statisticsApi.getComprehensiveStatistics(token!);
            setStats(data);
        } catch (error) {
            console.error('[StatisticsScreen] Failed to fetch statistics:', error);
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStatistics();
    };

    if (loading && !stats) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Analyzing your reading journey...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !stats) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <EmptyState
                    icon="analytics-outline"
                    title="Error Loading Statistics"
                    message={error || 'Unable to load statistics'}
                    actionLabel="Retry"
                    onActionPress={fetchStatistics}
                />
            </SafeAreaView>
        );
    }

    const hoursListened = Math.round(stats.summary.totalMinutesRead / 60);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Reading Statistics</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Summary Cards */}
                <View style={styles.summaryCards}>
                    <StatCard
                        title="Books Read"
                        value={stats.summary.totalBooksRead}
                        icon="book"
                        style={styles.summaryCard}
                    />
                    <StatCard
                        title="Pages Read"
                        value={stats.summary.totalPagesRead.toLocaleString()}
                        icon="document-text"
                        style={styles.summaryCard}
                    />
                </View>

                <View style={styles.summaryCards}>
                    <StatCard
                        title="Hours Listened"
                        value={hoursListened}
                        icon="headset"
                        style={styles.summaryCard}
                    />
                </View>

                {/* Reading Streak */}
                <StreakCard
                    currentStreak={stats.streak.currentStreak}
                    longestStreak={stats.streak.longestStreak}
                />

                {/* Reading Method Breakdown */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="bookmarks" size={24} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Reading Methods</Text>
                    </View>

                    {stats.methodBreakdown.physical.booksCount > 0 && (
                        <View style={styles.methodRow}>
                            <Text style={[styles.methodLabel, { color: colors.text }]}>Physical</Text>
                            <View style={styles.methodStats}>
                                <Text style={[styles.methodValue, { color: colors.textSecondary }]}>
                                    {stats.methodBreakdown.physical.booksCount} books
                                </Text>
                                <Text style={[styles.methodPercentage, { color: colors.primary }]}>
                                    {stats.methodBreakdown.physical.percentage.toFixed(0)}%
                                </Text>
                            </View>
                        </View>
                    )}

                    {stats.methodBreakdown.ebook.booksCount > 0 && (
                        <View style={styles.methodRow}>
                            <Text style={[styles.methodLabel, { color: colors.text }]}>Ebook</Text>
                            <View style={styles.methodStats}>
                                <Text style={[styles.methodValue, { color: colors.textSecondary }]}>
                                    {stats.methodBreakdown.ebook.booksCount} books
                                </Text>
                                <Text style={[styles.methodPercentage, { color: colors.primary }]}>
                                    {stats.methodBreakdown.ebook.percentage.toFixed(0)}%
                                </Text>
                            </View>
                        </View>
                    )}

                    {stats.methodBreakdown.audiobook.booksCount > 0 && (
                        <View style={styles.methodRow}>
                            <Text style={[styles.methodLabel, { color: colors.text }]}>Audiobook</Text>
                            <View style={styles.methodStats}>
                                <Text style={[styles.methodValue, { color: colors.textSecondary }]}>
                                    {stats.methodBreakdown.audiobook.booksCount} books
                                </Text>
                                <Text style={[styles.methodPercentage, { color: colors.primary }]}>
                                    {stats.methodBreakdown.audiobook.percentage.toFixed(0)}%
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Top Genres */}
                {stats.topGenres && stats.topGenres.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="pricetags" size={24} color={colors.primary} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Top Genres</Text>
                        </View>

                        {stats.topGenres.map((genre, index) => (
                            <View key={genre.genreId} style={styles.listRow}>
                                <View style={styles.listRank}>
                                    <Text style={[styles.rankNumber, { color: colors.primary }]}>#{index + 1}</Text>
                                </View>
                                <Text style={[styles.listLabel, { color: colors.text }]}>{genre.genreName}</Text>
                                <Text style={[styles.listValue, { color: colors.textSecondary }]}>
                                    {genre.booksRead} books
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Top Authors */}
                {stats.topAuthors && stats.topAuthors.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="person" size={24} color={colors.primary} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Top Authors</Text>
                        </View>

                        {stats.topAuthors.map((author, index) => (
                            <View key={author.authorId} style={styles.listRow}>
                                <View style={styles.listRank}>
                                    <Text style={[styles.rankNumber, { color: colors.primary }]}>#{index + 1}</Text>
                                </View>
                                <Text style={[styles.listLabel, { color: colors.text }]}>{author.authorName}</Text>
                                <Text style={[styles.listValue, { color: colors.textSecondary }]}>
                                    {author.booksRead} books
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Completion Card */}
                {stats.completion && (
                    <CompletionCard completionStats={{
                        totalStarted: stats.completion.totalStarted,
                        totalCompleted: stats.completion.totalCompleted,
                        totalDnf: stats.completion.totalDnf,
                        completionRate: stats.completion.completionRate,
                        dnfRate: 0,
                        dnfReasons: [],
                        velocity: {
                            avgDaysToComplete: 0,
                            avgPagesPerDay: 0,
                            avgMinutesPerDay: 0,
                        },
                    }} />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: Typography.h3.fontWeight,
    },
    placeholder: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.base,
        fontSize: Typography.body.fontSize,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.base,
    },
    summaryCards: {
        flexDirection: 'row',
        marginBottom: Spacing.base,
        gap: Spacing.base,
    },
    summaryCard: {
        flex: 1,
    },
    card: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: Spacing.base,
        ...Shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.base,
    },
    cardTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: Typography.h3.fontWeight,
        marginLeft: Spacing.sm,
    },
    methodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    methodLabel: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
    },
    methodStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    methodValue: {
        fontSize: Typography.bodySmall.fontSize,
    },
    methodPercentage: {
        fontSize: Typography.body.fontSize,
        fontWeight: '700',
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    listRank: {
        width: 40,
    },
    rankNumber: {
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '700',
    },
    listLabel: {
        flex: 1,
        fontSize: Typography.body.fontSize,
    },
    listValue: {
        fontSize: Typography.bodySmall.fontSize,
    },
});
