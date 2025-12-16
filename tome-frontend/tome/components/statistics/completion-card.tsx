import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CompletionStatisticsDTO } from '@/types/statistics';

interface CompletionCardProps {
    completionStats: CompletionStatisticsDTO;
}

export function CompletionCard({ completionStats }: CompletionCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const completionPercentage = Math.round(completionStats.completionRate);

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.header}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={[styles.headerText, { color: colors.text }]}>Completion Rate</Text>
            </View>

            <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: colors.success }]}>{completionPercentage}%</Text>
                <Text style={[styles.percentageLabel, { color: colors.textSecondary }]}>
                    {completionStats.totalCompleted} of {completionStats.totalStarted} books completed
                </Text>
            </View>

            {completionStats.totalDnf > 0 && (
                <View style={styles.dnfContainer}>
                    <Text style={[styles.dnfText, { color: colors.textSecondary }]}>
                        Did Not Finish: {completionStats.totalDnf}
                    </Text>
                </View>
            )}

            {completionStats.velocity && (
                <View style={styles.velocityContainer}>
                    <Text style={[styles.velocityTitle, { color: colors.textSecondary }]}>Reading Velocity</Text>
                    <View style={styles.velocityStats}>
                        <View style={styles.velocityStat}>
                            <Text style={[styles.velocityValue, { color: colors.text }]}>
                                {Math.round(completionStats.velocity.avgDaysToComplete)}
                            </Text>
                            <Text style={[styles.velocityLabel, { color: colors.textSecondary }]}>
                                days to complete
                            </Text>
                        </View>
                        <View style={styles.velocityStat}>
                            <Text style={[styles.velocityValue, { color: colors.text }]}>
                                {Math.round(completionStats.velocity.avgPagesPerDay)}
                            </Text>
                            <Text style={[styles.velocityLabel, { color: colors.textSecondary }]}>
                                pages per day
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: Spacing.base,
        ...Shadows.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.base,
    },
    headerText: {
        fontSize: Typography.h3.fontSize,
        fontWeight: Typography.h3.fontWeight,
        marginLeft: Spacing.sm,
    },
    percentageContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.base,
    },
    percentageText: {
        fontSize: 48,
        fontWeight: '700',
        marginBottom: Spacing.xs,
    },
    percentageLabel: {
        fontSize: Typography.bodySmall.fontSize,
        textAlign: 'center',
    },
    dnfContainer: {
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        marginTop: Spacing.sm,
    },
    dnfText: {
        fontSize: Typography.bodySmall.fontSize,
        textAlign: 'center',
    },
    velocityContainer: {
        marginTop: Spacing.base,
        paddingTop: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    velocityTitle: {
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    velocityStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    velocityStat: {
        alignItems: 'center',
    },
    velocityValue: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
    },
    velocityLabel: {
        fontSize: Typography.caption.fontSize,
        textAlign: 'center',
        marginTop: Spacing.xs / 2,
    },
});
