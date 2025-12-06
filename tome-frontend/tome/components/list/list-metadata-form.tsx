import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ListMetadataFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

interface ListMetadataFormProps {
  initialData?: Partial<ListMetadataFormData>;
  onFormDataChange: (data: ListMetadataFormData, isValid: boolean) => void;
}

export function ListMetadataForm({
  initialData,
  onFormDataChange,
}: ListMetadataFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? false);
  const [nameTouched, setNameTouched] = useState(false);

  // Validate and notify parent of changes
  useEffect(() => {
    const isValid = name.trim().length > 0;
    const formData: ListMetadataFormData = {
      name: name.trim(),
      description: description.trim(),
      isPublic,
    };
    onFormDataChange(formData, isValid);
  }, [name, description, isPublic, onFormDataChange]);

  const nameError = nameTouched && name.trim().length === 0;

  return (
    <View style={styles.container}>
      {/* List Name Input */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text, fontFamily: Fonts.sans }]}>
          List Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: nameError ? colors.error : colors.border,
              color: colors.text,
              fontFamily: Fonts.sans,
            },
          ]}
          placeholder="e.g., Summer Reading List"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          onBlur={() => setNameTouched(true)}
          maxLength={100}
          returnKeyType="next"
          accessibilityLabel="List name"
          accessibilityHint="Enter a name for your list"
        />
        {nameError && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            List name is required
          </Text>
        )}
      </View>

      {/* Description Input */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text, fontFamily: Fonts.sans }]}>
          Description
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
              fontFamily: Fonts.sans,
            },
          ]}
          placeholder="Describe your list (optional)"
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          returnKeyType="done"
          accessibilityLabel="List description"
          accessibilityHint="Enter an optional description for your list"
        />
        <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
          {description.length}/500
        </Text>
      </View>

      {/* Public/Private Toggle */}
      <View style={styles.fieldContainer}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Text style={[styles.label, { color: colors.text, fontFamily: Fonts.sans }]}>
              Make this list public
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
              {isPublic
                ? 'Anyone can view this list'
                : 'Only you can view this list'}
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            accessibilityLabel="List visibility"
            accessibilityHint={isPublic ? 'List is public' : 'List is private'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  characterCount: {
    ...Typography.bodySmall,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  hint: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
});
