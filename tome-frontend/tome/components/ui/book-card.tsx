import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Shadows, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface BookData {
    id: string;
    title: string;
    author: string;
    isbn: string;
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
    const bookIsbn = book.isbn;
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
            <View style={[styles.coverContainer, { backgroundColor: colors.backgroundAlt }]}>
                {true ? (
                    <Image
                        source={{ uri: `https://covers.openlibrary.org/b/isbn/${bookIsbn}-L.jpg` }}
                        style={styles.cover}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.placeholderCover, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.placeholderText, { color: colors.textLight }]}>
                            {book.title.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.details}>
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
                        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
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
    },
    title: {
        ...Typography.bodySmall,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    author: {
        ...Typography.caption,
        marginBottom: Spacing.sm,
    },
    progressContainer: {
        marginTop: Spacing.xs,
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
        marginTop: Spacing.xs,
        textAlign: 'right',
    },
});
