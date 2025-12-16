import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StreakCardProps {
    currentStreak: number;
    longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.header}>
                <Ionicons name="flame" size={24} color={colors.primary} />
                <Text style={[styles.headerText, { color: colors.text }]}>Reading Streak</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>{currentStreak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
                    <Text style={[styles.statUnit, { color: colors.textSecondary }]}>days</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>{longestStreak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Longest Streak</Text>
                    <Text style={[styles.statUnit, { color: colors.textSecondary }]}>days</Text>
                </View>
            </View>
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
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 36,
        fontWeight: '700',
        marginBottom: Spacing.xs / 2,
    },
    statLabel: {
        fontSize: Typography.bodySmall.fontSize,
        marginBottom: Spacing.xs / 4,
    },
    statUnit: {
        fontSize: Typography.caption.fontSize,
    },
    divider: {
        width: 1,
        height: 60,
        marginHorizontal: Spacing.base,
    },
});
