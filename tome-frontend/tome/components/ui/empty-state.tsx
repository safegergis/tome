import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from './button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onActionPress,
  style,
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={colors.primary} style={styles.icon} />
      <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.serif }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {actionLabel && onActionPress && (
        <Button
          title={actionLabel}
          onPress={onActionPress}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  action: {
    minWidth: 200,
  },
});
