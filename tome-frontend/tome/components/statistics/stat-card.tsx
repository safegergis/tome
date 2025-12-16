import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: keyof typeof Ionicons.glyphMap;
    style?: ViewStyle;
}

export function StatCard({ title, value, icon, style }: StatCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
            {icon && (
                <Ionicons
                    name={icon}
                    size={24}
                    color={colors.primary}
                    style={styles.icon}
                />
            )}
            <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: Spacing.base,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
        ...Shadows.sm,
    },
    icon: {
        marginBottom: Spacing.xs,
    },
    value: {
        fontSize: Typography.h2.fontSize,
        fontWeight: Typography.h2.fontWeight,
        marginBottom: Spacing.xs / 2,
    },
    title: {
        fontSize: Typography.bodySmall.fontSize,
        textAlign: 'center',
    },
});
