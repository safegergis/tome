import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { listApi } from '@/services/list.service';
import { ListDTO, BookSummaryDTO } from '@/types/list';
import { ListHeader } from '@/components/list/list-header';
import { ListEditModeHeader } from '@/components/list/list-edit-mode-header';
import { DraggableBookList } from '@/components/list/draggable-book-list';
import { ListMetadataForm, ListMetadataFormData } from '@/components/list/list-metadata-form';
import { BookCard, BookData } from '@/components/ui/book-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function ListDisplayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token, user } = useAuth();

  const [list, setList] = useState<ListDTO | null>(null);
  const [books, setBooks] = useState<BookSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit mode state
  const [editMetadataModalVisible, setEditMetadataModalVisible] = useState(false);
  const [metadataFormData, setMetadataFormData] = useState<ListMetadataFormData>({
    name: '',
    description: '',
    isPublic: false,
  });
  const [isMetadataFormValid, setIsMetadataFormValid] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [reorderedBooks, setReorderedBooks] = useState<BookSummaryDTO[]>([]);

  const isOwner = user && list && user.userId === list.userId;

  const fetchList = async (showLoader = true) => {
    if (!id || !token) return;

    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      const listData = await listApi.getList(parseInt(id), true, token);
      setList(listData);
      setBooks(listData.books || []);
    } catch (err) {
      console.error('Failed to fetch list:', err);
      setError(err instanceof Error ? err.message : 'Failed to load list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [id, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchList(false);
  };

  const handleBookPress = (bookId: number) => {
    // In edit mode, don't navigate to prevent accidental navigation
    if (!isEditMode) {
      router.push(`/books/${bookId}`);
    }
  };

  const handleRemoveBook = async (bookId: number) => {
    if (!token || !list) return;

    try {
      // Optimistic update
      const updatedBooks = books.filter((b) => b.id !== bookId);
      setBooks(updatedBooks);

      // Also update reorderedBooks if we have unsaved order
      if (hasUnsavedOrder) {
        const updatedReorderedBooks = reorderedBooks.filter((b) => b.id !== bookId);
        setReorderedBooks(updatedReorderedBooks);
      }

      await listApi.removeBookFromList(list.id, bookId, token);

      // Update list book count
      setList((prev) => prev ? { ...prev, bookCount: prev.bookCount - 1 } : null);
    } catch (err) {
      console.error('Failed to remove book:', err);
      Alert.alert('Error', 'Failed to remove book from list');
      // Refetch to restore correct state
      fetchList(false);
    }
  };

  const handleReorder = (newOrder: BookSummaryDTO[]) => {
    setReorderedBooks(newOrder);
    setHasUnsavedOrder(true);
  };

  const handleSaveOrder = async () => {
    if (!token || !list || !hasUnsavedOrder) return;

    try {
      // Extract book IDs in the new order
      const bookIds = reorderedBooks.map((book) => book.id);

      // Call API to save the order
      await listApi.reorderBooks(list.id, bookIds, token);

      // Update local state
      setBooks(reorderedBooks);
      setHasUnsavedOrder(false);

      Alert.alert('Success', 'Book order saved');
    } catch (err) {
      console.error('Failed to save book order:', err);
      Alert.alert('Error', 'Failed to save book order');
    }
  };

  const handleEditMetadata = () => {
    if (!list) return;

    setMetadataFormData({
      name: list.name,
      description: list.description || '',
      isPublic: list.isPublic,
    });
    setEditMetadataModalVisible(true);
  };

  const handleSaveMetadata = async () => {
    if (!isMetadataFormValid || !token || !list) return;

    try {
      setMetadataLoading(true);

      const updatedList = await listApi.updateList(
        list.id,
        {
          name: metadataFormData.name,
          description: metadataFormData.description || undefined,
          isPublic: metadataFormData.isPublic,
        },
        token
      );

      setList(updatedList);
      setEditMetadataModalVisible(false);
      Alert.alert('Success', 'List updated successfully');
    } catch (err) {
      console.error('Failed to update list:', err);
      Alert.alert('Error', 'Failed to update list');
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleDeleteList = async () => {
    if (!token || !list) return;

    try {
      await listApi.deleteList(list.id, token);
      Alert.alert('Success', 'List deleted successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.error('Failed to delete list:', err);
      Alert.alert('Error', 'Failed to delete list');
    }
  };

  const handleAddBooks = () => {
    // TODO: Implement book search/add functionality
    Alert.alert('Add Books', 'This feature will be implemented in Phase 4');
  };

  const handleMetadataFormChange = useCallback((data: ListMetadataFormData, isValid: boolean) => {
    setMetadataFormData(data);
    setIsMetadataFormValid(isValid);
  }, []);

  const transformBookToCardData = (book: BookSummaryDTO): BookData => ({
    id: book.id.toString(),
    title: book.title,
    author: book.authorNames.join(', ') || 'Unknown Author',
    isbn: book.isbn10 || book.isbn13 || '',
    coverUrl: book.coverUrl,
  });


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !list) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <EmptyState
            icon="alert-circle-outline"
            title="Failed to Load List"
            message={error || 'This list could not be found'}
            actionLabel="Try Again"
            onAction={() => fetchList()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Books are already in the correct order from the server
  const displayBooks = books;

  // Render header separately for both modes
  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      {isOwner && !isEditMode && (
        <TouchableOpacity
          onPress={() => setIsEditMode(true)}
          style={styles.editButtonWithLabel}
          accessibilityLabel="Edit list"
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text style={[styles.editButtonText, { color: colors.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>
      )}

      {isOwner && isEditMode && (
        <TouchableOpacity
          onPress={() => setIsEditMode(false)}
          style={styles.editButtonWithLabel}
          accessibilityLabel="Done editing"
        >
          <Ionicons name="checkmark" size={20} color={colors.primary} />
          <Text style={[styles.editButtonText, { color: colors.primary }]}>
            Done
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render list info header
  const renderListInfo = () => (
    <>
      <ListHeader
        name={list.name}
        description={list.description}
        bookCount={list.bookCount}
        username={list.username}
        isPublic={list.isPublic}
      />

      {isEditMode && isOwner && (
        <ListEditModeHeader
          onEditMetadata={handleEditMetadata}
          onDeleteList={handleDeleteList}
          onAddBooks={handleAddBooks}
          hasUnsavedOrder={hasUnsavedOrder}
          onSaveOrder={handleSaveOrder}
          isDefault={list.isDefault}
        />
      )}

    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {renderHeader()}

      {/* Edit Mode with books: Use DraggableFlatList with ListHeaderComponent */}
      {isEditMode && displayBooks.length > 0 ? (
        <DraggableBookList
          books={hasUnsavedOrder ? reorderedBooks : displayBooks}
          onReorder={handleReorder}
          onRemoveBook={handleRemoveBook}
          onBookPress={handleBookPress}
          ListHeaderComponent={renderListInfo()}
        />
      ) : !isEditMode ? (
        /* View Mode: Use ScrollView */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {renderListInfo()}

          {displayBooks.length > 0 ? (
            <View style={styles.booksGrid}>
              {displayBooks.map((book) => (
                <View key={book.id} style={styles.bookCardWrapper}>
                  <BookCard
                    book={transformBookToCardData(book)}
                    onPress={() => handleBookPress(book.id)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="book-outline"
                title="No Books Yet"
                message={
                  isOwner
                    ? 'Start adding books to your list'
                    : 'This list is empty'
                }
                actionLabel={isOwner ? 'Add Books' : undefined}
                onAction={isOwner ? handleAddBooks : undefined}
              />
            </View>
          )}
        </ScrollView>
      ) : (
        /* Edit Mode with no books: Show empty state with header */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderListInfo()}
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="book-outline"
              title="No Books Yet"
              message="Start adding books to your list"
              actionLabel="Add Books"
              onAction={handleAddBooks}
            />
          </View>
        </ScrollView>
      )}

      {/* Edit Metadata Modal */}
      <Modal
        visible={editMetadataModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditMetadataModalVisible(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit List
              </Text>
              <TouchableOpacity
                onPress={() => setEditMetadataModalVisible(false)}
                disabled={metadataLoading}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <ListMetadataForm
                initialData={metadataFormData}
                onFormDataChange={handleMetadataFormChange}
              />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                title="Cancel"
                variant="outlined"
                onPress={() => setEditMetadataModalVisible(false)}
                disabled={metadataLoading}
                style={styles.modalCancelButton}
              />
              <Button
                title="Save Changes"
                variant="primary"
                onPress={handleSaveMetadata}
                disabled={!isMetadataFormValid || metadataLoading}
                loading={metadataLoading}
                style={styles.modalSaveButton}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  editButtonWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  editButtonText: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  bookCardWrapper: {
    width: '50%',
    padding: Spacing.xs,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  keyboardAvoid: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h3,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSaveButton: {
    flex: 1,
  },
});
