import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { bookApi, BookDTO } from '@/services/api';
import { authService, UserDTO } from '@/services/auth.service';
import { BookCard } from '@/components/ui/book-card';
import { UserCard } from '@/components/ui/user-card';

type SearchType = 'books' | 'users';

export default function SearchScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [searchType, setSearchType] = useState<SearchType>('books');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookResults, setBookResults] = useState<BookDTO[]>([]);
    const [userResults, setUserResults] = useState<UserDTO[]>([]);

    // Debounced search function
    const performSearch = useCallback(async (searchQuery: string, type: SearchType) => {
        if (!searchQuery.trim()) {
            setBookResults([]);
            setUserResults([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (type === 'books') {
                const results = await bookApi.searchBooks(searchQuery);
                setBookResults(results);
            } else {
                const results = await authService.searchUsers(searchQuery);
                setUserResults(results);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError(err instanceof Error ? err.message : 'Search failed');
            setBookResults([]);
            setUserResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle query change with debouncing
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query) {
                performSearch(query, searchType);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query, searchType, performSearch]);

    // Clear results when switching tabs
    const handleTabChange = (type: SearchType) => {
        setSearchType(type);
        setBookResults([]);
        setUserResults([]);
        setError(null);
        if (query) {
            performSearch(query, type);
        }
    };

    const handleBookPress = (bookId: number) => {
        router.push(`/books/${bookId}`);
    };

    const handleUserPress = (userId: number) => {
        // Future: navigate to user profile
        console.log('User pressed:', userId);
    };

    const renderEmptyState = () => {
        if (loading) return null;
        if (!query) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons
                        name={searchType === 'books' ? 'book-outline' : 'people-outline'}
                        size={64}
                        color={colors.textSecondary}
                    />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {searchType === 'books'
                            ? 'Search for books by title or author'
                            : 'Search for users by username'}
                    </Text>
                </View>
            );
        }
        if (error) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                    <Text style={[styles.emptyText, { color: colors.error }]}>{error}</Text>
                </View>
            );
        }
        const hasResults = searchType === 'books' ? bookResults.length > 0 : userResults.length > 0;
        if (!hasResults) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No {searchType} found
                    </Text>
                </View>
            );
        }
        return null;
    };

    const renderBookItem = ({ item }: { item: BookDTO }) => {
        const authors = item.authors?.map((a) => a.name).join(', ') || 'Unknown Author';
        return (
            <BookCard
                book={{
                    id: item.id.toString(),
                    title: item.title,
                    isbn: item.isbn10 as string,
                    author: authors,
                    coverUrl: item.coverUrl,
                }}
                onPress={() => handleBookPress(item.id)}
                style={styles.resultCard}
            />
        );
    };

    const renderUserItem = ({ item }: { item: UserDTO }) => (
        <UserCard
            user={item}
            onPress={() => handleUserPress(item.id)}
            style={styles.resultCard}
        />
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.serif }]}>
                    Search
                </Text>

                {/* Search Input */}
                <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[
                            styles.searchInput,
                            { color: colors.text, fontFamily: Fonts.sans },
                        ]}
                        placeholder={`Search ${searchType}...`}
                        placeholderTextColor={colors.textSecondary}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        searchType === 'books' && styles.activeTab,
                        {
                            borderBottomColor: searchType === 'books' ? colors.primary : 'transparent',
                        },
                    ]}
                    onPress={() => handleTabChange('books')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: searchType === 'books' ? colors.primary : colors.textSecondary },
                        ]}
                    >
                        Books
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        searchType === 'users' && styles.activeTab,
                        {
                            borderBottomColor: searchType === 'users' ? colors.primary : 'transparent',
                        },
                    ]}
                    onPress={() => handleTabChange('users')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: searchType === 'users' ? colors.primary : colors.textSecondary },
                        ]}
                    >
                        Users
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Results */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Searching...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={searchType === 'books' ? bookResults : userResults}
                    renderItem={searchType === 'books' ? renderBookItem : renderUserItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.resultsList}
                    ListEmptyComponent={renderEmptyState}
                    key={searchType} // Force re-render when tab changes
                    numColumns={searchType === 'books' ? 2 : 1}
                    columnWrapperStyle={searchType === 'books' ? styles.row : undefined}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    headerTitle: {
        ...Typography.h2,
        marginBottom: Spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        height: 44,
    },
    searchIcon: {
        marginRight: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...Typography.body,
        padding: 0,
    },
    clearButton: {
        padding: Spacing.xs,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingHorizontal: Spacing.base,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        ...Typography.body,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
    loadingText: {
        ...Typography.body,
        marginTop: Spacing.md,
    },
    resultsList: {
        padding: Spacing.base,
        flexGrow: 1,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    resultCard: {
        flex: 1,
        marginBottom: Spacing.md,
        marginHorizontal: Spacing.xs,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
        paddingHorizontal: Spacing.xl,
    },
    emptyText: {
        ...Typography.body,
        textAlign: 'center',
        marginTop: Spacing.lg,
    },
});
