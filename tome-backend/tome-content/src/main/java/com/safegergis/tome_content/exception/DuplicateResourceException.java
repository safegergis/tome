package com.safegergis.tome_content.exception;

/**
 * Exception thrown when attempting to create a resource that already exists
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String resourceType, String identifier) {
        super(String.format("%s with identifier '%s' already exists", resourceType, identifier));
    }
}
