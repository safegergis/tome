import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SortOption = 'date-added' | 'alphabetical' | 'custom';

interface ListActionBarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showCustomSort?: boolean;
}

export function ListActionBar({
  sortBy,
  onSortChange,
  showCustomSort = false,
}: ListActionBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sortOptions: { value: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'date-added', label: 'Recent', icon: 'time-outline' },
    { value: 'alphabetical', label: 'A-Z', icon: 'text-outline' },
  ];

  if (showCustomSort) {
    sortOptions.push({ value: 'custom', label: 'Custom', icon: 'reorder-four-outline' });
  }

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
        Sort by:
      </Text>
      <View style={styles.optionsContainer}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              sortBy === option.value && styles.activeOption,
              {
                backgroundColor: sortBy === option.value ? colors.primary + '15' : 'transparent',
                borderColor: sortBy === option.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSortChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${option.label}`}
            accessibilityState={{ selected: sortBy === option.value }}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={sortBy === option.value ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.optionText,
                {
                  color: sortBy === option.value ? colors.primary : colors.textSecondary,
                  fontFamily: Fonts.sans,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  label: {
    ...Typography.bodySmall,
    marginRight: Spacing.md,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeOption: {
    // Styles applied via inline styles
  },
  optionText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
});
