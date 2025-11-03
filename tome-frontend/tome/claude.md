# Tome - Social Book Tracker

## Application Overview

Tome is a social book tracking application that combines the best features of Goodreads and Letterboxd. The app allows users to track their reading, create custom book lists, and engage with a community of readers through social features and book clubs.

### Core Features

#### MVP (Social-feature-less)
- User authentication (login/register)
- Book tracking (mark books as read, currently reading, want to read)
- Search functionality for books
- Custom list creation and management
- User profile and reading history
- Individual book details and information

#### Future Features (Post-MVP)
- Social features (friends, following)
- Book clubs
- Activity feeds
- Reviews and ratings sharing
- Social interactions (likes, comments)

---

## Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Package Manager**: pnpm

---

## Design System

### Color Palette

**Primary Colors:**
- **Eggshell White**: `#F5F5DC` (backgrounds, light surfaces)
- **Purple Primary**: `#6B46C1` (primary actions, emphasis)
- **Purple Dark**: `#553C9A` (hover states, dark accents)
- **Purple Light**: `#9F7AEA` (secondary elements, highlights)

**Neutral Colors:**
- **Text Primary**: `#1A1A1A` (main text)
- **Text Secondary**: `#4A4A4A` (secondary text)
- **Border**: `#D4D4D4` (dividers, borders)
- **Background**: `#FAFAF8` (alternate backgrounds)

**Semantic Colors:**
- **Success**: `#10B981` (confirmations)
- **Error**: `#EF4444` (errors, warnings)
- **Info**: `#3B82F6` (information)

### Typography

**Font Family:**
- **Primary**: Serif font (e.g., "Merriweather", "Crimson Text", or "Lora")
- **Secondary**: Sans-serif font for UI elements (e.g., "Inter" or "System")

**Type Scale:**
- **Heading 1**: 32px, Bold, Serif
- **Heading 2**: 24px, Bold, Serif
- **Heading 3**: 20px, Semibold, Serif
- **Body**: 16px, Regular, Serif
- **Body Small**: 14px, Regular, Serif
- **Caption**: 12px, Regular, Sans-serif
- **Button**: 16px, Semibold, Sans-serif

### Spacing System
- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64

### Border Radius
- **Small**: 4px (buttons, inputs)
- **Medium**: 8px (cards)
- **Large**: 16px (modals, sheets)

### Shadows
- **Small**: `0 1px 3px rgba(0, 0, 0, 0.12)`
- **Medium**: `0 4px 6px rgba(0, 0, 0, 0.1)`
- **Large**: `0 10px 15px rgba(0, 0, 0, 0.15)`

---

## Screen Structure

### 1. Authentication Screens

#### Login Screen (`/login`)
- Email/password input fields
- Login button
- Link to register screen
- "Forgot password" link

#### Register Screen (`/register`)
- Username input
- Email input
- Password input
- Confirm password input
- Register button
- Link to login screen

---

### 2. Home Screen (`/home` or `/`)
- Welcome message
- Recently added books
- Reading progress overview
- Quick access to current reads
- Featured lists (user's own or popular)

---

### 3. Search Screen (`/search`)
- Search bar with autocomplete
- Filter options (by author, genre, year, etc.)
- Search results grid/list
- Book preview cards with cover and basic info

---

### 4. My Profile Screen (`/profile`)
- User avatar and username
- Reading statistics (books read, pages read, reading streak)
- Reading goals
- Recent activity
- Lists overview (with count)
- Settings/edit profile button

---

### 5. My Lists Screen (`/lists`)
- List of all user-created lists
- "Create New List" button
- List preview cards showing:
  - List name
  - Number of books
  - First few book covers
  - Created date

---

### 6. List Display Screen (`/lists/[id]`)
- List title and description
- Edit/delete list options (if owner)
- Book grid/list view toggle
- Books in the list with covers
- Add books button
- Sort/filter options

---

### 7. Book Display Screen (`/books/[id]`)
- Book cover (large)
- Title and author
- Publication details
- Synopsis/description
- User's reading status (read, currently reading, want to read)
- Add to list button
- Personal notes section
- Rating (for future reviews feature)

---

## Screen Build Status

- [ ] Login Screen
- [ ] Register Screen
- [ ] Home Screen
- [ ] Search Screen
- [ ] My Profile Screen
- [ ] My Lists Screen
- [ ] List Display Screen
- [ ] Book Display Screen

---

## Component Library (To Be Built)

### Common Components
- Button (primary, secondary, outlined)
- Input field
- Card
- Book cover component
- Avatar
- Navigation header
- Bottom tab navigator
- Loading states
- Empty states
- Error states

---

## Data Models (Preliminary)

### User
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  // Social features (future)
  // friends?: User[];
  // followers?: User[];
}
```

### Book
```typescript
interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  isbn?: string;
  description: string;
  publishedDate?: Date;
  pageCount?: number;
  genre?: string[];
}
```

### UserBook (Reading Status)
```typescript
type ReadingStatus = 'want-to-read' | 'currently-reading' | 'read';

interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  startedAt?: Date;
  finishedAt?: Date;
  notes?: string;
  rating?: number; // 1-5 stars
}
```

### List
```typescript
interface List {
  id: string;
  userId: string;
  name: string;
  description?: string;
  books: string[]; // book IDs
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}
```

---

## Notes

- This is an MVP build focusing on core book tracking and list functionality
- Social features will be added in future iterations
- The app should work seamlessly on both iOS and Android
- Consider offline functionality for viewing saved books/lists
- API integration will be needed for book data (e.g., Google Books API, Open Library API)

---

## Development Roadmap

1. **Phase 1: Authentication & Setup**
   - Set up design system and theme
   - Build authentication screens
   - Implement user authentication flow

2. **Phase 2: Core Features**
   - Build book display and search
   - Implement reading status tracking
   - Create profile screen

3. **Phase 3: Lists & Organization**
   - Build list creation and management
   - Implement list display
   - Add book organization features

4. **Phase 4: Polish & Refinement**
   - Add animations and transitions
   - Implement loading and error states
   - Optimize performance
   - User testing and bug fixes

5. **Phase 5: Social Features (Post-MVP)**
   - Friends and following
   - Book clubs
   - Activity feeds
   - Social interactions
