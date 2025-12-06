import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReadingSessionDTO, ReadingMethod } from '@/types/reading-session';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ReadingSessionCardProps {
  session: ReadingSessionDTO;
  onPress?: () => void;
  style?: ViewStyle;
}

// Icon mapping for reading methods
const READING_METHOD_ICONS: Record<ReadingMethod, keyof typeof Ionicons.glyphMap> = {
  [ReadingMethod.PHYSICAL]: 'book-outline',
  [ReadingMethod.EBOOK]: 'tablet-portrait-outline',
  [ReadingMethod.AUDIOBOOK]: 'headset-outline',
};

// Format date as relative time or absolute date
function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export function ReadingSessionCard({
  session,
  onPress,
  style,
}: ReadingSessionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const coverUrl = session.book.isbn10
    ? `https://covers.openlibrary.org/b/isbn/${session.book.isbn10}-M.jpg`
    : null;

  const methodIcon = READING_METHOD_ICONS[session.readingMethod];
  const methodLabel =
    session.readingMethod === ReadingMethod.PHYSICAL
      ? 'Physical'
      : session.readingMethod === ReadingMethod.EBOOK
      ? 'Ebook'
      : 'Audiobook';

  const progressText =
    session.readingMethod === ReadingMethod.AUDIOBOOK
      ? `${session.minutesRead} minutes`
      : session.pagesRead
      ? `${session.pagesRead} pages`
      : session.startPage && session.endPage
      ? `Pages ${session.startPage}-${session.endPage}`
      : 'No progress recorded';

  const formattedDate = formatSessionDate(session.sessionDate);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.container}>
        {/* Book Cover */}
        <View style={styles.coverContainer}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
              <Text style={[styles.coverPlaceholderText, { color: colors.textSecondary }]}>
                {session.book.title.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Session Details */}
        <View style={styles.details}>
          <Text
            style={[styles.title, { color: colors.text, fontFamily: Fonts.serif }]}
            numberOfLines={2}
          >
            {session.book.title}
          </Text>
          <Text
            style={[styles.author, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            by {session.book.authorNames.join(', ')}
          </Text>

          {/* Method and Progress */}
          <View style={styles.metadata}>
            <Ionicons name={methodIcon} size={16} color={colors.primary} />
            <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
              {methodLabel} • {progressText}
            </Text>
          </View>

          {/* Date */}
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>

          {/* Notes Preview */}
          {session.notes && (
            <Text
              style={[styles.notes, { color: colors.text }]}
              numberOfLines={2}
            >
              "{session.notes}"
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  container: {
    flexDirection: 'row',
    padding: Spacing.base,
  },
  coverContainer: {
    marginRight: Spacing.base,
  },
  cover: {
    width: 60,
    height: 90,
    borderRadius: BorderRadius.sm,
  },
  coverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    ...Typography.h2,
  },
  details: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  author: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metadataText: {
    ...Typography.bodySmall,
    marginLeft: Spacing.xs,
  },
  date: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  notes: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
});
