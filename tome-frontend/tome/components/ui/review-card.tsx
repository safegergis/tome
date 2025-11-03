import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ReviewData {
  id: string;
  username: string;
  rating: number; // 1-5
  date: string;
  content: string;
  avatar?: string;
}

interface ReviewCardProps {
  review: ReviewData;
  style?: ViewStyle;
}

export function ReviewCard({ review, style }: ReviewCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= review.rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= review.rating ? colors.primary : colors.border}
            style={styles.star}
          />
        ))}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.textLight }]}>
              {review.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text
              style={[
                styles.username,
                { color: colors.text, fontFamily: Fonts.sans },
              ]}
            >
              {review.username}
            </Text>
            <Text
              style={[
                styles.date,
                { color: colors.textSecondary, fontFamily: Fonts.sans },
              ]}
            >
              {review.date}
            </Text>
          </View>
        </View>
        {renderStars()}
      </View>

      <Text
        style={[
          styles.content,
          { color: colors.text, fontFamily: Fonts.serif },
        ]}
      >
        {review.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    ...Typography.body,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  date: {
    ...Typography.caption,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginLeft: 2,
  },
  content: {
    ...Typography.body,
    lineHeight: 24,
  },
});
