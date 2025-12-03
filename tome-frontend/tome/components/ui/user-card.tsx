import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing, Shadows, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface UserData {
  id: number;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

interface UserCardProps {
  user: UserData;
  onPress?: () => void;
  style?: ViewStyle;
}

export function UserCard({ user, onPress, style }: UserCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, cardStyle, style]}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.avatarContainer, { backgroundColor: colors.backgroundAlt }]}>
        {user.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderAvatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={32} color={colors.textLight} />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text
          style={[
            styles.username,
            { color: colors.text, fontFamily: Fonts.serif },
          ]}
          numberOfLines={1}
        >
          @{user.username}
        </Text>
        {user.bio && (
          <Text
            style={[
              styles.bio,
              { color: colors.textSecondary, fontFamily: Fonts.serif },
            ]}
            numberOfLines={2}
          >
            {user.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  username: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  bio: {
    ...Typography.bodySmall,
  },
});
