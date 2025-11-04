# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tome is a social book tracking application combining features of Goodreads and Letterboxd. The repository contains a microservices-based architecture with a React Native frontend and Spring Boot backend.

**Current Status**: MVP development phase focusing on core book tracking without social features.

## Repository Structure

```
tome/
├── tome-frontend/tome/     # React Native app with Expo
└── tome-backend/           # Spring Boot microservices
    ├── docker-compose.yaml
    └── tome-users/         # User management service
```

## Development Commands

### Frontend (React Native + Expo)

**Location**: `tome-frontend/tome/`

**Package Manager**: pnpm (not npm or yarn)

```bash
# Start development server
pnpm start

# Run on specific platform
pnpm ios
pnpm android
pnpm web

# Linting
pnpm lint
```

### Backend (Spring Boot)

**Location**: `tome-backend/tome-users/`

```bash
# Run service locally (requires PostgreSQL running)
./mvnw spring-boot:run

# Build the project
./mvnw clean package

# Run tests
./mvnw test

# Start full stack with Docker (from tome-backend/)
cd tome-backend
docker-compose up -d

# Stop services
docker-compose down
```

**Database Configuration**:
- Database: `tomedb`
- Username: `myuser`
- Password: `secret`
- Port: `5432`

## Architecture

### Frontend Architecture

**Tech Stack**:
- React Native 0.81.4 with Expo ~54.0
- Expo Router (file-based routing)
- TypeScript
- React Navigation

**Routing Structure** (`tome-frontend/tome/app/`):
- `/` - Home screen (index.tsx)
- `/welcome` - Welcome screen
- `/home` - Main home view
- `/(auth)/login` - Login screen
- `/(auth)/register` - Registration screen
- `/books/[id]` - Dynamic book details

**Key Directories**:
- `app/` - File-based routing screens
- `components/` - Reusable React components
- `constants/` - App constants and configuration
- `hooks/` - Custom React hooks

**Design System**: Eggshell white (#F5F5DC) and purple (#6B46C1) color scheme with serif typography. See `tome-frontend/tome/claude.md` for complete design specifications.

### Backend Architecture

**Tech Stack**:
- Java 24
- Spring Boot 3.5.5
- Spring Data JPA
- PostgreSQL
- Maven
- Docker

**Microservices**:
- `tome-users` (port 8080): User management service
- Future services: `tome-books`, `tome-social`

**Current Implementation**: Basic Spring Boot application structure. JPA entities, repositories, controllers to be implemented as features develop.

## Data Models

Key TypeScript interfaces defined in frontend (`tome-frontend/tome/claude.md`):

- **User**: id, username, email, avatar, createdAt
- **Book**: id, title, author, coverUrl, isbn, description, publishedDate, pageCount, genre[]
- **UserBook**: Tracks reading status ('want-to-read', 'currently-reading', 'read')
- **List**: User-created book lists with id, name, description, books[], isPublic

## Development Workflow

1. **Frontend changes**: Work in `tome-frontend/tome/`, use pnpm for all commands
2. **Backend changes**: Work in `tome-backend/tome-users/`, use Maven wrapper (`./mvnw`)
3. **Full stack testing**: Use `docker-compose up` from `tome-backend/` directory
4. **Database access**: PostgreSQL runs on localhost:5432 when using Docker Compose

## Important Notes

- Frontend uses **pnpm**, not npm or yarn
- Backend requires **Java 24**
- The frontend has detailed design system documentation in `tome-frontend/tome/claude.md`
- MVP scope excludes social features (friends, book clubs, activity feeds)
- External API integration needed for book data (Google Books API or Open Library API)
