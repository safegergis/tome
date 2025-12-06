import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, {
    RenderItemParams,
    ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { BookSummaryDTO } from '@/types/list';
import { Colors, Spacing, BorderRadius, Typography, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DraggableBookListProps {
    books: BookSummaryDTO[];
    onReorder: (books: BookSummaryDTO[]) => void;
    onRemoveBook: (bookId: number) => void;
    onBookPress: (bookId: number) => void;
    ListHeaderComponent?: React.ReactElement;
}

export function DraggableBookList({
    books,
    onReorder,
    onRemoveBook,
    onBookPress,
    ListHeaderComponent,
}: DraggableBookListProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Filter out any undefined/null books
    const validBooks = books.filter((book) => book && book.id);

    const renderItem = ({ item, drag, isActive }: RenderItemParams<BookSummaryDTO>) => {
        return (
            <ScaleDecorator>
                <View style={[styles.itemContainer, isActive && styles.activeItem]}>
                    <View style={[styles.bookRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {/* Drag Handle */}
                        <TouchableOpacity
                            style={styles.dragHandleLeft}
                            onLongPress={drag}
                            disabled={isActive}
                            accessibilityRole="button"
                            accessibilityLabel="Drag to reorder"
                            accessibilityHint="Long press and drag to change book order"
                        >
                            <Ionicons name="reorder-three" size={28} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Book Info - Just Text */}
                        <View style={styles.bookInfo}>
                            <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                                {item.authorNames.join(', ') || 'Unknown Author'}
                            </Text>
                        </View>

                        {/* Remove Button */}
                        <TouchableOpacity
                            style={styles.removeButtonRight}
                            onPress={() => onRemoveBook(item.id)}
                            accessibilityRole="button"
                            accessibilityLabel="Remove book from list"
                        >
                            <Ionicons name="close-circle" size={28} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScaleDecorator>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <DraggableFlatList
                data={validBooks}
                onDragEnd={({ data }) => onReorder(data)}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={ListHeaderComponent}
                contentContainerStyle={styles.listContainer}
            />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.base,
        paddingBottom: Spacing.xl,
    },
    itemContainer: {
        width: '100%',
        paddingVertical: Spacing.xs,
    },
    activeItem: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    bookRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 72,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dragHandleLeft: {
        width: 52,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    bookInfo: {
        flex: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    bookTitle: {
        ...Typography.body,
        fontFamily: Fonts.serif,
        fontWeight: '600',
        marginBottom: Spacing.xs / 2,
    },
    bookAuthor: {
        ...Typography.bodySmall,
        fontFamily: Fonts.serif,
    },
    removeButtonRight: {
        width: 52,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
    },
});
