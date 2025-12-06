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
import { ReviewCard, ReviewData } from '@/components/ui/review-card';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { ReadingSessionModal } from '@/components/reading-session/reading-session-modal';
import { AddToListSheet } from '@/components/list/add-to-list-sheet';
import { CreateListModal } from '@/components/list/create-list-modal';
import { bookApi, BookDTO } from '@/services/api';
import { userBookApi } from '@/services/user-book.service';
import { UserBookDTO } from '@/types/reading-session';
import { useAuth } from '@/context/AuthContext';

// Mock reviews - these would come from a reviews API endpoint
const MOCK_REVIEWS: ReviewData[] = [
    {
        id: '1',
        username: 'BookLover23',
        rating: 5,
        date: 'Oct 15, 2024',
        content:
            'An absolute masterpiece! The writing is beautiful and the themes are still relevant today. A must-read for anyone interested in American literature.',
    },
    {
        id: '2',
        username: 'ClassicReader',
        rating: 4,
        date: 'Oct 10, 2024',
        content:
            'Great book with beautiful prose. The symbolism is rich and the characters are well-developed. Took me a while to get into it but definitely worth the read.',
    },
    {
        id: '3',
        username: 'ReadingEnthusiast',
        rating: 5,
        date: 'Oct 5, 2024',
        content:
            'One of my favorite books of all time. Fitzgerald\'s writing style is captivating and the story is both tragic and beautiful.',
    },
];

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
    const [userRating, setUserRating] = useState(0);
    const [notes, setNotes] = useState('');
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

    const renderStars = (rating: number) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={20}
                        color={star <= rating ? colors.primary : colors.border}
                        style={styles.star}
                    />
                ))}
            </View>
        );
    };

    const renderUserRatingStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setUserRating(star)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={star <= userRating ? 'star' : 'star-outline'}
                            size={32}
                            color={star <= userRating ? colors.primary : colors.border}
                            style={styles.star}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
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

                {/* Publication Details */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                        Details
                    </Text>
                    {book.publishedDate && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Published:</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{book.publishedDate}</Text>
                        </View>
                    )}
                    {book.pageCount && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pages:</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{book.pageCount}</Text>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ISBN:</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{isbn}</Text>
                    </View>
                    {book.publisher && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Publisher:</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{book.publisher}</Text>
                        </View>
                    )}
                </View>

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

                {/* User Rating */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                        Your Rating
                    </Text>
                    {renderUserRatingStars()}
                    {userRating > 0 && (
                        <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
                            You rated this book {userRating} stars
                        </Text>
                    )}
                </View>

                {/* Reviews Section */}
                <View style={styles.section}>
                    <View style={styles.reviewsHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                            Community Reviews
                        </Text>
                        <TouchableOpacity activeOpacity={0.7}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>
                                See All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {MOCK_REVIEWS.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <FloatingActionButton
                onPress={() => setSessionModalVisible(true)}
                bottom={Spacing.lg}
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
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    starsContainer: {
        flexDirection: 'row',
    },
    star: {
        marginHorizontal: 2,
    },
    ratingText: {
        ...Typography.bodySmall,
        marginLeft: Spacing.sm,
    },
    ratingLabel: {
        ...Typography.bodySmall,
        marginTop: Spacing.sm,
        textAlign: 'center',
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
    section: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.h3,
        marginBottom: Spacing.base,
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
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.base,
    },
    seeAllText: {
        ...Typography.bodySmall,
        fontWeight: '600',
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
