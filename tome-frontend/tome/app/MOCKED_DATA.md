# Mocked Data Documentation

This document outlines all the mock data currently used in the Tome application. This data should be replaced with real API calls and database queries in production.

---

## Home Screen (`/home.tsx`)

### Currently Reading Books
**Data Structure:** `BookData[]`

```typescript
MOCK_CURRENT_BOOKS = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    progress: 45,
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    progress: 78,
  },
  {
    id: '3',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    progress: 23,
  },
]
```

**Purpose:** Display books the user is currently reading with progress indicators

**TODO:** Replace with API call to fetch user's currently reading books
- Endpoint suggestion: `GET /api/users/{userId}/books/currently-reading`
- Should return book data with reading progress percentage

---

### Trending Books
**Data Structure:** `BookData[]`

```typescript
MOCK_TRENDING_BOOKS = [
  {
    id: '4',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
  },
  {
    id: '5',
    title: 'The Midnight Library',
    author: 'Matt Haig',
  },
  {
    id: '6',
    title: 'Atomic Habits',
    author: 'James Clear',
  },
  {
    id: '7',
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
  },
  {
    id: '8',
    title: 'Educated',
    author: 'Tara Westover',
  },
]
```

**Purpose:** Show trending/featured books to help users discover new content

**TODO:** Replace with API call to fetch trending books
- Endpoint suggestion: `GET /api/books/trending`
- Could be based on recent ratings, reads, or a curated list
- Consider adding filters like time period (this week, this month, etc.)

---

## Book Details Screen (`/books/[id].tsx`)

### Book Details
**Data Structure:** `Record<string, BookDetailData>`

```typescript
MOCK_BOOKS = {
  '1': {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverUrl: '',
    isbn: '978-0743273565',
    publishedDate: 'April 10, 1925',
    pageCount: 180,
    genre: ['Classic', 'Fiction', 'Romance'],
    description: '...',
    averageRating: 4.5,
    totalRatings: 1234,
  },
  '2': {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    coverUrl: '',
    isbn: '978-0451524935',
    publishedDate: 'June 8, 1949',
    pageCount: 328,
    genre: ['Dystopian', 'Science Fiction', 'Political Fiction'],
    description: '...',
    averageRating: 4.7,
    totalRatings: 2341,
  },
}
```

**Purpose:** Display comprehensive book information on the details page

**TODO:** Replace with API call to fetch book details
- Endpoint suggestion: `GET /api/books/{bookId}`
- Should integrate with a book database API like:
  - Google Books API
  - Open Library API
  - Goodreads API (if available)
- Include book cover images (currently using placeholder)

---

### Book Reviews
**Data Structure:** `ReviewData[]`

```typescript
MOCK_REVIEWS = [
  {
    id: '1',
    username: 'BookLover23',
    rating: 5,
    date: 'Oct 15, 2024',
    content: 'An absolute masterpiece! The writing is beautiful and the themes are still relevant today. A must-read for anyone interested in American literature.',
  },
  {
    id: '2',
    username: 'ClassicReader',
    rating: 4,
    date: 'Oct 10, 2024',
    content: 'Great book with beautiful prose. The symbolism is rich and the characters are well-developed. Took me a while to get into it but definitely worth the read.',
  },
  {
    id: '3',
    username: 'ReadingEnthusiast',
    rating: 5,
    date: 'Oct 5, 2024',
    content: 'One of my favorite books of all time. Fitzgerald\'s writing style is captivating and the story is both tragic and beautiful.',
  },
]
```

**Purpose:** Display community reviews for the book

**TODO:** Replace with API call to fetch book reviews
- Endpoint suggestion: `GET /api/books/{bookId}/reviews`
- Support pagination (currently showing first 3 reviews)
- Add ability to filter/sort reviews (most recent, highest rated, etc.)
- Implement "See All" functionality to view complete review list

---

## Components Using Mock Data

### SearchBar (`/components/ui/search-bar.tsx`)
- Currently non-functional (just displays UI)
- **TODO:** Implement search functionality
  - Connect to search endpoint: `GET /api/books/search?q={query}`
  - Add autocomplete/suggestions
  - Navigate to search results page

### BookCard (`/components/ui/book-card.tsx`)
- Uses `BookData` interface but no internal mock data
- Cover images are placeholders (using first letter of title)
- **TODO:** Ensure real cover URLs are provided from API

### BookSection (`/components/ui/book-section.tsx`)
- Generic component that displays books passed as props
- No internal mock data

---

## User State (Not Yet Implemented)

The following user-specific data is stored in local state but should be persisted:

### Reading Status
**Location:** Book Details Screen
**Data:** `ReadingStatus = 'none' | 'want-to-read' | 'currently-reading' | 'read'`

**TODO:**
- Persist user's reading status for each book
- Endpoint: `POST /api/users/{userId}/books/{bookId}/status`
- Endpoint: `GET /api/users/{userId}/books/{bookId}/status`

### User Rating
**Location:** Book Details Screen
**Data:** `number` (1-5 stars)

**TODO:**
- Save user's rating for each book
- Endpoint: `POST /api/users/{userId}/books/{bookId}/rating`
- Update book's average rating when user rates

### Personal Notes
**Location:** Book Details Screen (UI not yet implemented)
**Data:** `string`

**TODO:**
- Add notes input UI
- Save user's personal notes about a book
- Endpoint: `POST /api/users/{userId}/books/{bookId}/notes`

---

## API Integration Priorities

1. **High Priority:**
   - Book details API (Google Books or Open Library)
   - User authentication and session management
   - Reading status tracking

2. **Medium Priority:**
   - Currently reading books with progress
   - User ratings
   - Book search functionality

3. **Lower Priority:**
   - Community reviews system
   - Trending books algorithm
   - Personal notes

---

## Notes

- All book IDs are currently simple strings ('1', '2', etc.)
- In production, use proper UUIDs or database-generated IDs
- Book cover images should be loaded from CDN or book data API
- Consider implementing offline caching for better UX
- Add loading states when fetching real data
- Implement error handling for failed API calls
