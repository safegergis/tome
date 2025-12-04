import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  ReadingMethod,
  ReadingSessionRequest,
  ReadingSessionErrors,
  UserBookDTO,
} from '@/types/reading-session';
import { BookPicker } from '@/components/ui/book-picker';
import { ReadingMethodSelector } from '@/components/reading-session/reading-method-selector';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';

interface ReadingSessionFormProps {
  preselectedBook?: UserBookDTO | null;
  onFormDataChange?: (data: Partial<ReadingSessionRequest>, isValid: boolean) => void;
}

export function ReadingSessionForm({
  preselectedBook,
  onFormDataChange,
}: ReadingSessionFormProps) {
  // Form state
  const [selectedBook, setSelectedBook] = useState<UserBookDTO | null>(
    preselectedBook || null
  );
  const [readingMethod, setReadingMethod] = useState<ReadingMethod>(
    ReadingMethod.PHYSICAL
  );
  const [pagesRead, setPagesRead] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [minutesRead, setMinutesRead] = useState('');
  const [notes, setNotes] = useState('');
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Validation errors
  const [errors, setErrors] = useState<ReadingSessionErrors>({});

  // Update preselected book if prop changes
  useEffect(() => {
    if (preselectedBook) {
      setSelectedBook(preselectedBook);
    }
  }, [preselectedBook]);

  // Validate and notify parent of form data changes
  useEffect(() => {
    const formData: Partial<ReadingSessionRequest> = {
      bookId: selectedBook?.bookId,
      readingMethod,
      sessionDate,
      notes: notes.trim() || undefined,
    };

    // Add method-specific fields
    if (readingMethod === ReadingMethod.AUDIOBOOK) {
      formData.minutesRead = minutesRead ? parseInt(minutesRead, 10) : undefined;
    } else {
      formData.pagesRead = pagesRead ? parseInt(pagesRead, 10) : undefined;
      formData.startPage = startPage ? parseInt(startPage, 10) : undefined;
      formData.endPage = endPage ? parseInt(endPage, 10) : undefined;
    }

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    const isValid = Object.keys(validationErrors).length === 0;
    onFormDataChange?.(formData, isValid);
  }, [
    selectedBook,
    readingMethod,
    pagesRead,
    startPage,
    endPage,
    minutesRead,
    notes,
    sessionDate,
  ]);

  const validateForm = (
    data: Partial<ReadingSessionRequest>
  ): ReadingSessionErrors => {
    const validationErrors: ReadingSessionErrors = {};

    // Book selection required
    if (!data.bookId) {
      validationErrors.bookId = 'Please select a book';
    }

    // Method-specific validation
    if (data.readingMethod === ReadingMethod.AUDIOBOOK) {
      if (!data.minutesRead || data.minutesRead <= 0) {
        validationErrors.minutesRead = 'Minutes read is required for audiobooks';
      }
    } else if (
      data.readingMethod === ReadingMethod.PHYSICAL ||
      data.readingMethod === ReadingMethod.EBOOK
    ) {
      if (!data.pagesRead || data.pagesRead <= 0) {
        validationErrors.pagesRead = 'Pages read is required';
      }

      // Validate page range if both are provided
      if (data.startPage && data.endPage && data.startPage >= data.endPage) {
        validationErrors.endPage = 'End page must be greater than start page';
      }
    }

    return validationErrors;
  };

  const handleReadingMethodChange = (method: ReadingMethod) => {
    setReadingMethod(method);
    // Clear errors when switching methods
    setErrors({});
  };

  return (
    <View style={styles.form}>
      {/* Book Picker */}
      <BookPicker
        selectedBook={selectedBook}
        onSelectBook={setSelectedBook}
        label="Book *"
        error={errors.bookId}
        disabled={!!preselectedBook}
      />

      {/* Reading Method Selector */}
      <ReadingMethodSelector
        selectedMethod={readingMethod}
        onSelectMethod={handleReadingMethodChange}
        label="Reading Method *"
      />

      {/* Conditional Fields: Audiobook */}
      {readingMethod === ReadingMethod.AUDIOBOOK && (
        <Input
          label="Minutes Read *"
          placeholder="e.g., 45"
          value={minutesRead}
          onChangeText={setMinutesRead}
          keyboardType="numeric"
          error={errors.minutesRead}
        />
      )}

      {/* Conditional Fields: Physical/Ebook */}
      {(readingMethod === ReadingMethod.PHYSICAL ||
        readingMethod === ReadingMethod.EBOOK) && (
        <>
          <Input
            label="Pages Read *"
            placeholder="e.g., 25"
            value={pagesRead}
            onChangeText={setPagesRead}
            keyboardType="numeric"
            error={errors.pagesRead}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="Start Page"
                placeholder="e.g., 45"
                value={startPage}
                onChangeText={setStartPage}
                keyboardType="numeric"
                error={errors.startPage}
              />
            </View>

            <View style={styles.halfWidth}>
              <Input
                label="End Page"
                placeholder="e.g., 70"
                value={endPage}
                onChangeText={setEndPage}
                keyboardType="numeric"
                error={errors.endPage}
              />
            </View>
          </View>
        </>
      )}

      {/* Session Date */}
      <Input
        label="Date"
        placeholder="YYYY-MM-DD"
        value={sessionDate}
        onChangeText={setSessionDate}
        keyboardType={Platform.OS === 'ios' ? 'default' : 'numeric'}
      />

      {/* Notes */}
      <Input
        label="Notes"
        placeholder="Add any notes about this session..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        inputStyle={styles.notesInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
});
