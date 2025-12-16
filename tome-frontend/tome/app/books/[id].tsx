import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { ReadingSessionModal } from '@/components/reading-session/reading-session-modal';
import { AddToListSheet } from '@/components/list/add-to-list-sheet';
import { CreateListModal } from '@/components/list/create-list-modal';
import { bookApi, BookDTO } from '@/services/api';
import { userBookApi } from '@/services/user-book.service';
import { UserBookDTO } from '@/types/reading-session';
import { useAuth } from '@/context/AuthContext';

type ReadingStatus = 'none' | 'want-to-read' | 'currently-reading' | 'read' | 'did-not-finish';

export default function BookDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { token } = useAuth();

    const [book, setBook] = useState<BookDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userBook, setUserBook] = useState<UserBookDTO | null>(null);
    const [readingStatus, setReadingStatus] = useState<ReadingStatus>('none');
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [sessionModalVisible, setSessionModalVisible] = useState(false);
    const [addToListSheetVisible, setAddToListSheetVisible] = useState(false);
    const [createListModalVisible, setCreateListModalVisible] = useState(false);

    // Fetch book data and user's reading status
    useEffect(() => {
        async function fetchBookData() {
            try {
                setLoading(true);
                setError(null);

                // Fetch book details
                const bookData = await bookApi.getBookById(Number(id));
                setBook(bookData);

                // Fetch user's status for this book if logged in
                if (token) {
                    try {
                        const allUserBooks = await userBookApi.getUserBooks(token);
                        const existingUserBook = allUserBooks.find(ub => ub.bookId === Number(id));

                        if (existingUserBook) {
                            setUserBook(existingUserBook);
                            setReadingStatus(existingUserBook.status);
                        }
                    } catch (err) {
                        console.log('No existing user book found or error fetching:', err);
                    }
                }
            } catch (err) {
                console.error('Error fetching book:', err);
                setError(err instanceof Error ? err.message : 'Failed to load book');
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchBookData();
        }
    }, [id, token]);

    const handleBack = () => {
        router.back();
    };

    const handleAddToList = () => {
        setAddToListSheetVisible(true);
    };

    const handleCreateListFromSheet = () => {
        setCreateListModalVisible(true);
    };

    const handleSessionLogged = () => {
        console.log('Session logged for book:', id);
        // Optionally refresh book data or show a success message
    };

    const handleStatusChange = async (newStatus: ReadingStatus) => {
        if (!token || newStatus === 'none') return;

        try {
            setStatusUpdating(true);

            // Convert frontend status to backend format
            const backendStatus = newStatus.toUpperCase().replace(/-/g, '_') as
                'WANT_TO_READ' | 'CURRENTLY_READING' | 'READ' | 'DID_NOT_FINISH';

            let updatedUserBook: UserBookDTO;

            if (userBook) {
                // Update existing user book
                updatedUserBook = await userBookApi.updateReadingStatus(
                    userBook.id,
                    newStatus,
                    token
                );
            } else {
                // Add new book to shelf
                updatedUserBook = await userBookApi.addBookToShelf(
                    Number(id),
                    backendStatus,
                    token
                );
            }

            setUserBook(updatedUserBook);
            setReadingStatus(newStatus);
            console.log('Status updated successfully:', newStatus);
        } catch (err) {
            console.error('Error updating status:', err);
            // Optionally show error to user
        } finally {
            setStatusUpdating(false);
        }
    };

    const getStatusButtonStyle = (status: ReadingStatus) => {
        return readingStatus === status ? 'primary' : 'outlined';
    };

    // Show loading spinner
    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                        Book Details
                    </Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading book details...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error message
    if (error || !book) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                        Book Details
                    </Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centerContainer}>
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        {error || 'Book not found'}
                    </Text>
                    <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
                        Make sure the backend server is running
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Prepare display data
    const authorNames = book.authors && book.authors.length > 0
        ? book.authors.map(a => a.name).join(', ')
        : 'Unknown Author';
    const genreNames = book.genres?.map(g => g.name) || [];
    const isbn = book.isbn13 || book.isbn10 || 'N/A';

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                    Book Details
                </Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Book Cover and Basic Info */}
                <View style={styles.bookHeader}>
                    <View style={[styles.coverContainer, { backgroundColor: colors.surface }]}>
                        {book.isbn10 ? (
                            <Image
                                source={{ uri: `https://covers.openlibrary.org/b/isbn/${book.isbn10}-L.jpg` }}
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

                    <View style={styles.basicInfo}>
                        <Text
                            style={[styles.title, { color: colors.text, fontFamily: Fonts.serif }]}
                        >
                            {book.title}
                        </Text>
                        <Text
                            style={[styles.author, { color: colors.textSecondary, fontFamily: Fonts.serif }]}
                        >
                            by {authorNames}
                        </Text>

                        {genreNames.length > 0 && (
                            <View style={styles.genres}>
                                {genreNames.map((genre: string, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.genreTag,
                                            {
                                                backgroundColor: colors.backgroundAlt,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.genreText,
                                                { color: colors.primary, fontFamily: Fonts.sans },
                                            ]}
                                        >
                                            {genre}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Description */}
                {book.description && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                            Synopsis
                        </Text>
                        <Text
                            style={[styles.description, { color: colors.text, fontFamily: Fonts.serif }]}
                        >
                            {book.description}
                        </Text>
                    </View>
                )}

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Reading Status */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                        Reading Status
                    </Text>
                    <View style={styles.statusButtons}>
                        <Button
                            title="Want to Read"
                            onPress={() => handleStatusChange('want-to-read')}
                            variant={getStatusButtonStyle('want-to-read')}
                            style={styles.statusButton}
                            disabled={statusUpdating}
                            loading={statusUpdating && readingStatus === 'want-to-read'}
                        />
                        <Button
                            title="Currently Reading"
                            onPress={() => handleStatusChange('currently-reading')}
                            variant={getStatusButtonStyle('currently-reading')}
                            style={styles.statusButton}
                            disabled={statusUpdating}
                            loading={statusUpdating && readingStatus === 'currently-reading'}
                        />
                    </View>
                    {(readingStatus === 'read' || readingStatus === 'did-not-finish') && (
                        <Text style={[styles.statusNote, { color: colors.textSecondary }]}>
                            Status: {readingStatus === 'read' ? 'Finished' : 'Did Not Finish'}
                        </Text>
                    )}
                    <Button
                        title="Add to List"
                        onPress={handleAddToList}
                        variant="outlined"
                        fullWidth
                        style={{ marginTop: Spacing.md }}
                    />
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Publication Details Capsule */}
                <View style={styles.section}>
                    <View style={[styles.detailsCapsule, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.serif, marginBottom: Spacing.md }]}>
                            Details
                        </Text>
                        {book.publishedDate && (
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Published</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{book.publishedDate}</Text>
                            </View>
                        )}
                        {book.pageCount && (
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pages</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{book.pageCount}</Text>
                            </View>
                        )}
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ISBN</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{isbn}</Text>
                        </View>
                        {book.publisher && (
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Publisher</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{book.publisher}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <FloatingActionButton
                onPress={() => setSessionModalVisible(true)}
                bottom={Spacing.lg}
                right={Spacing.lg}
            />

            {/* Reading Session Modal */}
            <ReadingSessionModal
                visible={sessionModalVisible}
                onClose={() => setSessionModalVisible(false)}
                onSuccess={handleSessionLogged}
                preselectedBookId={book?.id || null}
            />

            {/* Add to List Sheet */}
            <AddToListSheet
                visible={addToListSheetVisible}
                onClose={() => setAddToListSheetVisible(false)}
                bookId={book?.id || 0}
                onSuccess={() => console.log('Book added to list')}
                onCreateList={handleCreateListFromSheet}
            />

            {/* Create List Modal */}
            <CreateListModal
                visible={createListModalVisible}
                onClose={() => setCreateListModalVisible(false)}
                onSuccess={(listId) => {
                    setCreateListModalVisible(false);
                    console.log('List created:', listId);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        ...Typography.h3,
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 44,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    bookHeader: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.base,
        alignItems: 'center',
    },
    coverContainer: {
        width: 200,
        height: 300,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        ...Shadows.lg,
        marginBottom: Spacing.lg,
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
        fontSize: 72,
        fontWeight: '700',
    },
    basicInfo: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        ...Typography.h1,
        fontSize: 28,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    author: {
        ...Typography.h3,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: Spacing.base,
    },
    genres: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    genreTag: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
    },
    genreText: {
        ...Typography.caption,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.lg,
        opacity: 0.3,
    },
    section: {
        marginTop: Spacing.base,
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.h3,
        marginBottom: Spacing.base,
    },
    detailsCapsule: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        ...Shadows.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    detailLabel: {
        ...Typography.body,
        fontWeight: '600',
    },
    detailValue: {
        ...Typography.body,
    },
    description: {
        ...Typography.body,
        lineHeight: 26,
    },
    statusButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    statusButton: {
        flex: 1,
    },
    statusNote: {
        ...Typography.bodySmall,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    loadingText: {
        ...Typography.body,
        marginTop: Spacing.base,
    },
    errorText: {
        ...Typography.h3,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    errorHint: {
        ...Typography.bodySmall,
        textAlign: 'center',
    },
});
