package com.safegergis.tome_user_data.enums;

/**
 * Status of friend requests
 */
public enum FriendRequestStatus {
    PENDING,
    REJECTED;

    /**
     * Parse string to FriendRequestStatus enum
     * Supports both kebab-case and UPPER_CASE formats
     */
    public static FriendRequestStatus fromString(String value) {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException("Friend request status cannot be null or empty");
        }
        try {
            return FriendRequestStatus.valueOf(value.toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown friend request status: " + value);
        }
    }
}
