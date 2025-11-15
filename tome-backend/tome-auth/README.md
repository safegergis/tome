# Tome Auth Service

Authentication and authorization microservice for the Tome application.

## Features

- ✅ User registration with email verification
- ✅ User login with JWT authentication
- ✅ 6-character verification codes (24-hour expiry)
- ✅ JWT tokens with user ID (24-hour expiry)
- ✅ Password reset codes (future feature)
- ✅ BCrypt password hashing
- ✅ Password security requirements (uppercase, lowercase, numbers)
- ✅ Beautiful Thymeleaf email templates
- ✅ Async email sending
- ✅ Soft deletes for users
- ✅ Comprehensive input validation

## Tech Stack

- Java 17
- Spring Boot 3.5.7
- Spring Data JPA
- Spring Security
- Spring Mail
- PostgreSQL
- JWT (JJWT 0.12.3)
- Thymeleaf
- Lombok

## Prerequisites

- Java 17 or higher
- PostgreSQL 12 or higher
- Maven 3.6+
- SMTP server (Gmail, SendGrid, etc.)

## Setup

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE tomedb;
CREATE USER myuser WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE tomedb TO myuser;
```

### 2. Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Required environment variables:

```properties
DB_URL=jdbc:postgresql://localhost:5432/tomedb
DB_USER=myuser
DB_PASSWORD=secret

MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:8081
```

### 3. Gmail Setup (if using Gmail)

1. Enable 2-factor authentication on your Google account
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate a new app password
4. Use this password in `MAIL_PASSWORD`

### 4. Run the Application

```bash
# Clean and compile
./mvnw clean compile

# Run the application
./mvnw spring-boot:run
```

The service will start on `http://localhost:8080`

## API Endpoints

### Register User

**POST** `/api/auth/register`

Request:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response (201 Created):
```json
{
  "userId": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "message": "Registration successful. Please check your email to verify your account."
}
```

### Verify Email

**POST** `/api/auth/verify-email`

Request:
```json
{
  "userId": 1,
  "code": "ABC123"
}
```

Response (200 OK):
```json
{
  "message": "Email verified successfully"
}
```

### Resend Verification Email

**POST** `/api/auth/resend-verification`

Request:
```json
{
  "email": "john@example.com"
}
```

Response (200 OK):
```json
{
  "message": "Verification email sent successfully"
}
```

### Login

**POST** `/api/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response (200 OK):
```json
{
  "userId": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

Error Response (401 Unauthorized):
```json
{
  "status": 401,
  "message": "Invalid email or password",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Verification Tokens Table

```sql
CREATE TABLE verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

Token types:
- `EMAIL_VERIFICATION` - For email verification (6-character alphanumeric code)
- `PASSWORD_RESET` - For password reset (future feature)

## Email Templates

The service includes three Thymeleaf email templates following the Tome design system:

1. **Verification Email** (`templates/email/verification.html`)
   - Sent after registration
   - Displays 6-character verification code
   - 24-hour expiry notice

2. **Password Reset Email** (`templates/email/password-reset.html`)
   - For password reset requests (future feature)
   - Security warnings included

3. **Welcome Email** (`templates/email/welcome.html`)
   - Sent after successful verification
   - Highlights key features

All templates use:
- Eggshell white (#F5F5DC) background
- Purple (#6B46C1) accents
- Serif typography (Georgia)

## Error Handling

The service provides detailed error responses:

### Validation Errors (400)
```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": {
    "username": "Username must be between 3 and 50 characters",
    "email": "Email must be valid"
  }
}
```

### User Already Exists (409)
```json
{
  "status": 409,
  "message": "Username already exists",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Verification Errors (400)
```json
{
  "status": 400,
  "message": "Verification token has expired",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Authentication Errors (401)
```json
{
  "status": 401,
  "message": "Invalid email or password",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## JWT Authentication

### JWT Token Structure

The login endpoint returns a JWT token that contains:

**Claims:**
- `userId` - User's unique ID
- `username` - User's username
- `email` - User's email
- `sub` - Subject (userId as string)
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp (24 hours from issue)

**Example decoded JWT:**
```json
{
  "userId": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "sub": "1",
  "iat": 1705320000,
  "exp": 1705406400
}
```

### Using JWT Tokens

Include the JWT token in the `Authorization` header for authenticated requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT Configuration

- **Secret Key**: Configured via `JWT_SECRET` environment variable (must be base64 encoded, min 256 bits)
- **Expiration**: 24 hours (86400000 milliseconds) - configurable via `jwt.expiration` property
- **Algorithm**: HS256 (HMAC with SHA-256)

**Generate a secure key:**
```bash
openssl rand -base64 32
```

## Development

### Run Tests

```bash
./mvnw test
```

### Build

```bash
./mvnw clean package
```

### Docker (Coming Soon)

```bash
docker build -t tome-auth .
docker run -p 8080:8080 tome-auth
```

## Security Considerations

- ✅ Passwords are hashed with BCrypt (strength 10)
- ✅ Verification tokens expire after 24 hours
- ✅ Soft deletes prevent data loss
- ✅ Input validation on all requests
- ⚠️ CSRF disabled for API endpoints (development only)
- 🔄 JWT authentication (coming soon)
- 🔄 Rate limiting (coming soon)

## Future Enhancements

- [ ] Password reset flow
- [ ] JWT token generation
- [ ] Refresh token mechanism
- [ ] OAuth2 social login (Google, GitHub)
- [ ] Rate limiting
- [ ] Email verification link clicking analytics
- [ ] Multi-factor authentication (MFA)

## Troubleshooting

### Emails not sending

1. Check SMTP credentials
2. Verify SMTP port (587 for TLS)
3. For Gmail, ensure app password is used
4. Check logs for detailed error messages

### Database connection errors

1. Verify PostgreSQL is running
2. Check database credentials
3. Ensure database exists
4. Verify network connectivity

### Port already in use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

## License

Part of the Tome project.
