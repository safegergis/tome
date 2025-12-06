import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: ViewStyle;
}

export function SegmentedControl({
  options,
  selectedValue,
  onValueChange,
  style,
}: SegmentedControlProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.segmentedControl}>
        {options.map((option, index) => {
          const isSelected = selectedValue === option.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.segment,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: colors.primary,
                },
                isFirst && styles.segmentFirst,
                isLast && styles.segmentLast,
                index > 0 && styles.segmentMiddle,
              ]}
              onPress={() => onValueChange(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: isSelected ? colors.textLight : colors.primary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  segmentFirst: {
    borderTopLeftRadius: BorderRadius.sm,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  segmentLast: {
    borderTopRightRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  segmentMiddle: {
    borderLeftWidth: 0,
  },
  segmentText: {
    ...Typography.button,
    fontSize: 14,
  },
});
