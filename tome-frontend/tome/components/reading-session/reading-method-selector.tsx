import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ReadingMethod } from '@/types/reading-session';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ReadingMethodSelectorProps {
  selectedMethod: ReadingMethod;
  onSelectMethod: (method: ReadingMethod) => void;
  label?: string;
}

const METHOD_OPTIONS = [
  { value: ReadingMethod.PHYSICAL, label: 'Physical' },
  { value: ReadingMethod.EBOOK, label: 'Ebook' },
  { value: ReadingMethod.AUDIOBOOK, label: 'Audiobook' },
];

export function ReadingMethodSelector({
  selectedMethod,
  onSelectMethod,
  label = 'Reading Method',
}: ReadingMethodSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <View style={styles.segmentedControl}>
        {METHOD_OPTIONS.map((option, index) => {
          const isSelected = selectedMethod === option.value;
          const isFirst = index === 0;
          const isLast = index === METHOD_OPTIONS.length - 1;

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
              onPress={() => onSelectMethod(option.value)}
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
  label: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
    fontWeight: '500',
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
