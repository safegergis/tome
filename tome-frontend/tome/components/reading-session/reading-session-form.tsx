import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
    ReadingMethod,
    ReadingSessionRequest,
    ReadingSessionErrors,
    UserBookDTO,
} from '@/types/reading-session';
import { BookPicker } from '@/components/ui/book-picker';
import { ReadingMethodSelector } from '@/components/reading-session/reading-method-selector';
import { Input } from '@/components/ui/input';
import { Collapsible } from '@/components/ui/collapsible';
import { userBookApi } from '@/services/user-book.service';
import { useAuth } from '@/context/AuthContext';
import { Spacing, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ReadingSessionFormProps {
    preselectedBook?: UserBookDTO | null;
    onFormDataChange?: (data: Partial<ReadingSessionRequest>, isValid: boolean) => void;
}

export function ReadingSessionForm({
    preselectedBook,
    onFormDataChange,
}: ReadingSessionFormProps) {
    const { token } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

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

    // Book details override state
    const [totalPageCount, setTotalPageCount] = useState('');
    const [totalAudioLength, setTotalAudioLength] = useState(''); // in minutes
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Validation errors
    const [errors, setErrors] = useState<ReadingSessionErrors>({});

    // Update preselected book if prop changes (track bookId to avoid infinite loop)
    useEffect(() => {
        if (preselectedBook && preselectedBook.bookId !== selectedBook?.bookId) {
            setSelectedBook(preselectedBook);
        }
    }, [preselectedBook?.bookId]);

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

    // Pre-fill total page count / audio length when book or reading method changes
    useEffect(() => {
        if (!selectedBook) return;

        // Pre-fill total page count for Physical/Ebook
        if (readingMethod === ReadingMethod.PHYSICAL || readingMethod === ReadingMethod.EBOOK) {
            const userOverride = selectedBook.userPageCount;
            const bookDefault = readingMethod === ReadingMethod.EBOOK
                ? (selectedBook.book.ebookPageCount || selectedBook.book.pageCount)
                : selectedBook.book.pageCount;

            const effectivePageCount = userOverride ?? bookDefault;
            setTotalPageCount(effectivePageCount ? String(effectivePageCount) : '');
        }

        // Pre-fill total audio length for Audiobook
        if (readingMethod === ReadingMethod.AUDIOBOOK) {
            const userOverride = selectedBook.userAudioLengthSeconds;
            const bookDefault = selectedBook.book.audioLengthSeconds;

            const effectiveSeconds = userOverride ?? bookDefault;
            // Convert seconds to minutes for display
            setTotalAudioLength(effectiveSeconds ? String(Math.round(effectiveSeconds / 60)) : '');
        }
    }, [selectedBook?.bookId, readingMethod]);

    // Update user override handler
    const handleUpdateUserOverride = useCallback(
        async (field: 'userPageCount' | 'userAudioLengthSeconds', value: number | undefined) => {
            if (!selectedBook || !selectedBook.id || !token) return;

            try {
                await userBookApi.updateUserBook(
                    selectedBook.id,
                    { [field]: value },
                    token
                );
                console.log(`[ReadingSessionForm] Updated ${field} to ${value}`);
            } catch (error) {
                console.error(`[ReadingSessionForm] Failed to update ${field}:`, error);
            }
        },
        [selectedBook?.id, token]
    );

    const handleTotalPageCountChange = (text: string) => {
        setTotalPageCount(text);

        // Debounce API call (1 second)
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            const value = text ? parseInt(text, 10) : undefined;
            if (value && value > 0) {
                handleUpdateUserOverride('userPageCount', value);
            }
        }, 1000);
    };

    const handleTotalAudioLengthChange = (text: string) => {
        setTotalAudioLength(text);

        // Debounce API call (1 second)
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            const minutes = text ? parseInt(text, 10) : undefined;
            if (minutes && minutes > 0) {
                // Convert minutes to seconds for backend
                handleUpdateUserOverride('userAudioLengthSeconds', minutes * 60);
            }
        }, 1000);
    };

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

            {/* Book Details (Collapsible Advanced Settings) */}
            {selectedBook && (
                <View style={styles.collapsibleContainer}>
                    <Collapsible title="Book Details">
                        <View style={styles.advancedContent}>
                            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                                Customize the total page count or audio length if your edition differs.
                            </Text>

                            {/* Show for Physical/Ebook */}
                            {(readingMethod === ReadingMethod.PHYSICAL ||
                                readingMethod === ReadingMethod.EBOOK) && (
                                    <Input
                                        label="Total Pages (Your Edition)"
                                        placeholder="e.g., 350"
                                        value={totalPageCount}
                                        onChangeText={handleTotalPageCountChange}
                                        keyboardType="numeric"
                                        helperText={
                                            selectedBook.book.pageCount
                                                ? `Default: ${selectedBook.book.pageCount} pages`
                                                : undefined
                                        }
                                    />
                                )}

                            {/* Show for Audiobook */}
                            {readingMethod === ReadingMethod.AUDIOBOOK && (
                                <Input
                                    label="Total Audio Length (Minutes)"
                                    placeholder="e.g., 720"
                                    value={totalAudioLength}
                                    onChangeText={handleTotalAudioLengthChange}
                                    keyboardType="numeric"
                                    helperText={
                                        selectedBook.book.audioLengthSeconds
                                            ? `Default: ${Math.round(selectedBook.book.audioLengthSeconds / 60)} minutes`
                                            : undefined
                                    }
                                />
                            )}
                        </View>
                    </Collapsible>
                </View>
            )}

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
    collapsibleContainer: {
        marginTop: Spacing.md,
    },
    advancedContent: {
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    helperText: {
        fontSize: 14,
        marginBottom: Spacing.sm,
    },
});
