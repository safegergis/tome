package com.safegergis.tome_user_data.enums;

public enum ReadingMethod {
    PHYSICAL,
    EBOOK,
    AUDIOBOOK;

    /**
     * Convert from lowercase string to enum
     * Supports both "physical" and "PHYSICAL" formats
     */
    public static ReadingMethod fromString(String value) {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException("Reading method cannot be null or empty");
        }

        try {
            return ReadingMethod.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown reading method: " + value);
        }
    }
}
