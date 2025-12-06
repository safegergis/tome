import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ListHeaderProps {
  name: string;
  description?: string;
  bookCount: number;
  username: string;
  isPublic: boolean;
}

export function ListHeader({
  name,
  description,
  bookCount,
  username,
  isPublic,
}: ListHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {/* List Name */}
      <Text style={[styles.name, { color: colors.text, fontFamily: Fonts.serif }]}>
        {name}
      </Text>

      {/* Metadata Row */}
      <View style={styles.metadataRow}>
        <View style={styles.metadataItem}>
          <Ionicons name="book-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.metadataText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            {bookCount} {bookCount === 1 ? 'book' : 'books'}
          </Text>
        </View>

        <View style={styles.metadataItem}>
          <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.metadataText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            by {username}
          </Text>
        </View>

        <View style={styles.metadataItem}>
          <Ionicons
            name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={[styles.metadataText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            {isPublic ? 'Public' : 'Private'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  name: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metadataText: {
    ...Typography.bodySmall,
  },
  description: {
    ...Typography.body,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
});
