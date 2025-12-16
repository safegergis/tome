import React, { useState } from 'react';
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

export interface BookData {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    isbn10?: string;
    isbn13?: string;
    coverUrl?: string;
    progress?: number; // 0-100 for currently reading books
}

interface BookCardProps {
    book: BookData;
    onPress?: () => void;
    showProgress?: boolean;
    style?: ViewStyle;
}

export function BookCard({
    book,
    onPress,
    showProgress = false,
    style,
}: BookCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [imageAttempt, setImageAttempt] = useState(0);
    const [showFallback, setShowFallback] = useState(false);

    // Determine which image URL to try based on attempt number
    const getImageUrl = () => {
        // Priority: isbn10 > isbn13 > isbn (legacy)
        let isbn: string | undefined;
        if (imageAttempt === 0) {
            // First attempt: try isbn10 or isbn (legacy)
            isbn = book.isbn10 || book.isbn;
        } else if (imageAttempt === 1) {
            // Second attempt: try isbn13
            isbn = book.isbn13;
        }

        if (isbn) {
            return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        }
        return undefined;
    };

    const handleImageError = () => {
        if (imageAttempt === 0 && book.isbn13) {
            // isbn10 failed, try isbn13 next
            setImageAttempt(1);
        } else {
            // No more options to try, show fallback
            setShowFallback(true);
        }
    };

    const imageUrl = getImageUrl();

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
            <View style={[styles.coverContainer, { backgroundColor: colors.backgroundAlt }]}>
                {!showFallback && imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.cover}
                        resizeMode="cover"
                        onError={handleImageError}
                    />
                ) : (
                    <View style={[styles.placeholderCover, { backgroundColor: colors.backgroundAlt }]}>
                        <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
                    </View>
                )}
            </View>

            <View style={styles.details}>
                <View style={styles.textContent}>
                    <Text
                        style={[
                            styles.title,
                            { color: colors.text, fontFamily: Fonts.serif },
                        ]}
                        numberOfLines={2}
                    >
                        {book.title}
                    </Text>
                    <Text
                        style={[
                            styles.author,
                            { color: colors.textSecondary, fontFamily: Fonts.serif },
                        ]}
                        numberOfLines={1}
                    >
                        {book.author}
                    </Text>
                </View>

                {showProgress && book.progress !== undefined && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: colors.primary,
                                        width: `${book.progress}%`,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                            {book.progress}%
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        ...Shadows.sm,
    },
    coverContainer: {
        width: '100%',
        aspectRatio: 2 / 3,
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    placeholderCover: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 48,
        fontWeight: '700',
    },
    details: {
        padding: Spacing.md,
        minHeight: 90,
        justifyContent: 'space-between',
    },
    textContent: {
        flex: 1,
    },
    title: {
        ...Typography.bodySmall,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    author: {
        ...Typography.caption,
    },
    progressContainer: {
        marginTop: Spacing.sm,
    },
    progressBar: {
        height: 4,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: BorderRadius.sm,
    },
    progressText: {
        ...Typography.caption,
        fontSize: 11,
        marginTop: Spacing.xs,
        textAlign: 'right',
    },
});
