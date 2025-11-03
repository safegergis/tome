import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  editable?: boolean;
  style?: ViewStyle;
}

export function SearchBar({
  placeholder = 'Search for books...',
  value = '',
  onChangeText,
  onPress,
  editable = true,
  style,
}: SearchBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...Shadows.sm,
  };

  const inputStyle = {
    color: colors.text,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.container, containerStyle, style]}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={20} color={colors.icon} />
        <View style={styles.textContainer}>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, inputStyle]}
            editable={false}
            value={value}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Ionicons name="search" size={20} color={colors.icon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, inputStyle]}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  input: {
    ...Typography.body,
    flex: 1,
    marginLeft: Spacing.sm,
    padding: 0,
    margin: 0,
  },
});
