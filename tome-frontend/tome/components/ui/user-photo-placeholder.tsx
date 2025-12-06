import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface UserPhotoPlaceholderProps {
  username: string;
  size?: number;
  style?: ViewStyle;
}

export function UserPhotoPlaceholder({
  username,
  size = 80,
  style,
}: UserPhotoPlaceholderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const firstLetter = username.charAt(0).toUpperCase();
  const fontSize = size * 0.5; // Scale font size to circle size

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.textLight,
            fontSize: fontSize,
          },
        ]}
      >
        {firstLetter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
