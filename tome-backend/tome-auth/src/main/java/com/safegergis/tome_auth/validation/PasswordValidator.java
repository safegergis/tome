package com.safegergis.tome_auth.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*[0-9].*";

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            return false;
        }

        boolean hasUppercase = password.matches(UPPERCASE_PATTERN);
        boolean hasLowercase = password.matches(LOWERCASE_PATTERN);
        boolean hasDigit = password.matches(DIGIT_PATTERN);

        if (!hasUppercase || !hasLowercase || !hasDigit) {
            context.disableDefaultConstraintViolation();

            if (!hasUppercase) {
                context.buildConstraintViolationWithTemplate("Password must contain at least one uppercase letter")
                        .addConstraintViolation();
            } else if (!hasLowercase) {
                context.buildConstraintViolationWithTemplate("Password must contain at least one lowercase letter")
                        .addConstraintViolation();
            } else if (!hasDigit) {
                context.buildConstraintViolationWithTemplate("Password must contain at least one number")
                        .addConstraintViolation();
            }
            return false;
        }

        return true;
    }
}
