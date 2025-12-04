package com.safegergis.tome_user_data.enums;

public enum ReadingStatus {
    WANT_TO_READ,
    CURRENTLY_READING,
    READ,
    DID_NOT_FINISH;

    /**
     * Convert from kebab-case string to enum
     * Supports both "currently-reading" and "CURRENTLY_READING" formats
     */
    public static ReadingStatus fromString(String value) {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException("Reading status cannot be null or empty");
        }

        // Try direct enum name match first (e.g., "CURRENTLY_READING")
        try {
            return ReadingStatus.valueOf(value.toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown reading status: " + value);
        }
    }
}
