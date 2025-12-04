package com.safegergis.tome_user_data.enums;

public enum ListType {
    CUSTOM,
    CURRENTLY_READING,
    TO_BE_READ;

    /**
     * Convert from kebab-case string to enum
     * Supports both "to-be-read" and "TO_BE_READ" formats
     */
    public static ListType fromString(String value) {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException("List type cannot be null or empty");
        }

        try {
            return ListType.valueOf(value.toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown list type: " + value);
        }
    }
}
