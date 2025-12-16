import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

interface BadgeProps {
  count: number;
  maxCount?: number; // Shows "{maxCount}+" if count exceeds this
  style?: any;
}

/**
 * Notification badge component
 * Displays a count in a red circle, typically for pending items
 */
export function Badge({ count, maxCount = 99, style }: BadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Don't render if count is 0 or negative
  if (count <= 0) {
    return null;
  }

  // Display count or "{maxCount}+" if exceeded
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View style={[styles.badge, { backgroundColor: colors.error }, style]}>
      <Text style={[styles.badgeText, { color: colors.textLight }]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
