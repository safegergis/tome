import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { listApi } from '@/services/list.service';
import { ListDTO } from '@/types/list';

interface AddToListSheetProps {
  visible: boolean;
  onClose: () => void;
  bookId: number;
  onSuccess?: () => void;
  onCreateList?: () => void;
}

interface ListCheckboxItem {
  list: ListDTO;
  isChecked: boolean;
  isLoading: boolean;
}

export function AddToListSheet({
  visible,
  onClose,
  bookId,
  onSuccess,
  onCreateList,
}: AddToListSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();

  const [listItems, setListItems] = useState<ListCheckboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && token) {
      fetchLists();
    }
  }, [visible, token]);

  const fetchLists = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const allLists = await listApi.getUserLists(token);

      // Check which lists already contain this book
      const listItemsWithStatus = await Promise.all(
        allLists.map(async (list) => {
          try {
            const listWithBooks = await listApi.getList(list.id, true, token);
            const isChecked = listWithBooks.books?.some((b) => b.id === bookId) || false;
            return { list, isChecked, isLoading: false };
          } catch {
            return { list, isChecked: false, isLoading: false };
          }
        })
      );

      setListItems(listItemsWithStatus);
    } catch (err) {
      console.error('Failed to fetch lists:', err);
      setError('Failed to load lists');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (listId: number) => {
    if (!token) return;

    const itemIndex = listItems.findIndex((i) => i.list.id === listId);
    if (itemIndex === -1) return;

    const item = listItems[itemIndex];
    const newCheckedState = !item.isChecked;

    // Optimistic update
    setListItems((prev) =>
      prev.map((i) =>
        i.list.id === listId
          ? { ...i, isChecked: newCheckedState, isLoading: true }
          : i
      )
    );

    try {
      if (newCheckedState) {
        // Add to list
        await listApi.addBookToList(listId, bookId, token);
      } else {
        // Remove from list
        await listApi.removeBookFromList(listId, bookId, token);
      }

      // Success - keep optimistic state
      setListItems((prev) =>
        prev.map((i) =>
          i.list.id === listId ? { ...i, isLoading: false } : i
        )
      );

      onSuccess?.();
    } catch (err) {
      console.error('Failed to toggle book in list:', err);

      // Revert optimistic update
      setListItems((prev) =>
        prev.map((i) =>
          i.list.id === listId
            ? { ...i, isChecked: !newCheckedState, isLoading: false }
            : i
        )
      );

      Alert.alert('Error', 'Failed to update list');
    }
  };

  const handleCreateList = () => {
    onClose();
    onCreateList?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Add to List
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Create New List Button */}
          <TouchableOpacity
            style={[styles.createListButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
            onPress={handleCreateList}
            accessibilityRole="button"
            accessibilityLabel="Create new list"
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Text style={[styles.createListText, { color: colors.primary, fontFamily: Fonts.sans }]}>
              Create New List
            </Text>
          </TouchableOpacity>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                Loading lists...
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.sans }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={fetchLists}
              >
                <Text style={[styles.retryButtonText, { color: '#FFFFFF', fontFamily: Fonts.sans }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lists */}
          {!loading && !error && listItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                You don't have any lists yet
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                Create your first list to get started
              </Text>
            </View>
          )}

          {!loading && !error && listItems.map((item) => (
            <TouchableOpacity
              key={item.list.id}
              style={[
                styles.listItem,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => handleToggle(item.list.id)}
              disabled={item.isLoading}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.isChecked }}
            >
              <View style={styles.listItemContent}>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: colors.text, fontFamily: Fonts.sans }]}>
                    {item.list.name}
                  </Text>
                  <Text style={[styles.listMeta, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                    {item.list.bookCount} {item.list.bookCount === 1 ? 'book' : 'books'}
                  </Text>
                </View>

                {item.isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: item.isChecked ? colors.primary : 'transparent',
                        borderColor: item.isChecked ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {item.isChecked && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.h3,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.base,
  },
  createListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  createListText: {
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorContainer: {
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyHint: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  listItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  listName: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  listMeta: {
    ...Typography.bodySmall,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
