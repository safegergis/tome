package com.safegergis.tome_user_data.exception;

/**
 * Exception thrown when a user attempts to access a resource they don't own
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException() {
        super("You do not have permission to access this resource");
    }
}
