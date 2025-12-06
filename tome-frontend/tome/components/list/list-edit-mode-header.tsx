import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Fonts, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ListEditModeHeaderProps {
  onEditMetadata: () => void;
  onDeleteList: () => void;
  onAddBooks: () => void;
  hasUnsavedOrder?: boolean;
  onSaveOrder?: () => void;
  isDefault?: boolean;
}

export function ListEditModeHeader({
  onEditMetadata,
  onDeleteList,
  onAddBooks,
  hasUnsavedOrder = false,
  onSaveOrder,
  isDefault = false,
}: ListEditModeHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleDeletePress = () => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDeleteList,
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* Save Order Banner (if reordering) */}
      {hasUnsavedOrder && onSaveOrder && (
        <View style={styles.saveOrderWrapper}>
          <TouchableOpacity
            style={[styles.saveOrderBanner, { backgroundColor: colors.primary }]}
            onPress={onSaveOrder}
            accessibilityRole="button"
            accessibilityLabel="Save new order"
            activeOpacity={0.8}
          >
            <View style={styles.saveOrderIconContainer}>
              <Ionicons name="save-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.saveOrderTextContainer}>
              <Text style={[styles.saveOrderTitle, { color: '#FFFFFF', fontFamily: Fonts.sans }]}>
                Save New Order
              </Text>
              <Text style={[styles.saveOrderSubtext, { color: 'rgba(255, 255, 255, 0.85)', fontFamily: Fonts.sans }]}>
                Tap to apply changes
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Actions - Grid Layout */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.gridButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onAddBooks}
          accessibilityRole="button"
          accessibilityLabel="Add books to list"
        >
          <View style={[styles.gridButtonIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.gridButtonText, { color: colors.text, fontFamily: Fonts.sans }]}>
            Add Books
          </Text>
        </TouchableOpacity>

        {!isDefault ? (
          <>
            <TouchableOpacity
              style={[styles.gridButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onEditMetadata}
              accessibilityRole="button"
              accessibilityLabel="Edit list details"
            >
              <View style={[styles.gridButtonIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="create" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.gridButtonText, { color: colors.text, fontFamily: Fonts.sans }]}>
                Edit Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleDeletePress}
              accessibilityRole="button"
              accessibilityLabel="Delete list"
            >
              <View style={[styles.gridButtonIconContainer, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="trash" size={24} color={colors.error} />
              </View>
              <Text style={[styles.gridButtonText, { color: colors.text, fontFamily: Fonts.sans }]}>
                Delete List
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.defaultListNotice}>
            <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            <Text style={[styles.defaultListNote, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
              Default list - Cannot edit details or delete
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  saveOrderWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  saveOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  saveOrderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  saveOrderTextContainer: {
    flex: 1,
  },
  saveOrderTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: Spacing.xs / 2,
  },
  saveOrderSubtext: {
    ...Typography.bodySmall,
    fontSize: 13,
  },
  actionsGrid: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  gridButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  gridButtonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  gridButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  defaultListNotice: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  defaultListNote: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
});
