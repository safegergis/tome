# Tome User Data API Documentation

The tome-user-data microservice manages user reading activities, including book tracking, reading sessions, and custom lists.

## Base URL
```
http://localhost:8081
```

## Authentication

All endpoints require JWT authentication. Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a JWT Token

First, authenticate with the tome-auth service:

```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com"
  }
}
```

Use the `token` value in subsequent requests to tome-user-data.

---

## User Books API

Manage books on a user's shelf with reading status and progress tracking.

### 1. Get User's Books

Retrieve all books or filter by reading status.

**Endpoint:** `GET /api/user-books`

**Query Parameters:**
- `status` (optional): Filter by reading status
  - `want-to-read`
  - `currently-reading`
  - `read`
  - `did-not-finish`

**Examples:**

Get all books:
```bash
curl http://localhost:8081/api/user-books \
  -H "Authorization: Bearer <token>"
```

Get currently reading books:
```bash
curl http://localhost:8081/api/user-books?status=currently-reading \
  -H "Authorization: Bearer <token>"
```

Get completed books:
```bash
curl http://localhost:8081/api/user-books?status=read \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "bookId": 42,
    "book": {
      "id": 42,
      "title": "The Great Gatsby",
      "coverUrl": "https://...",
      "authorNames": ["F. Scott Fitzgerald"],
      "pageCount": 180,
      "audioLengthSeconds": null
    },
    "status": "CURRENTLY_READING",
    "currentPage": 45,
    "currentSeconds": null,
    "progressPercentage": 25.0,
    "personalRating": null,
    "notes": "Reading for book club",
    "startedAt": "2024-11-01T10:00:00Z",
    "finishedAt": null,
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-12-03T15:30:00Z"
  }
]
```

### 2. Get Specific User Book

Retrieve details of a specific book on the user's shelf.

**Endpoint:** `GET /api/user-books/{id}`

**Example:**
```bash
curl http://localhost:8081/api/user-books/1 \
  -H "Authorization: Bearer <token>"
```

**Response:** Same as single book object above.

### 3. Add Book to Shelf

Add a new book to the user's shelf.

**Endpoint:** `POST /api/user-books`

**Request Body:**
```json
{
  "bookId": 42,
  "status": "WANT_TO_READ",
  "currentPage": 0,
  "currentSeconds": 0,
  "userPageCount": null,
  "userAudioLengthSeconds": null,
  "personalRating": null,
  "notes": "Recommended by a friend"
}
```

**Required Fields:**
- `bookId`: ID of the book from tome-content service
- `status`: Initial reading status (WANT_TO_READ, CURRENTLY_READING, READ, DID_NOT_FINISH)

**Optional Fields:**
- `currentPage`: Current page (default: 0)
- `currentSeconds`: Current position in audiobook (default: 0)
- `userPageCount`: Override book's page count for user's edition
- `userAudioLengthSeconds`: Override audiobook length
- `personalRating`: Rating from 1-5
- `notes`: Personal notes about the book

**Example:**
```bash
curl -X POST http://localhost:8081/api/user-books \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": 42,
    "status": "CURRENTLY_READING",
    "currentPage": 0,
    "notes": "Starting this today!"
  }'
```

**Response:** Created user book object with status 201.

### 4. Update User Book

Update all fields of a user book.

**Endpoint:** `PUT /api/user-books/{id}`

**Request Body:** Same as POST, all fields can be updated.

**Example:**
```bash
curl -X PUT http://localhost:8081/api/user-books/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CURRENTLY_READING",
    "currentPage": 100,
    "personalRating": 5,
    "notes": "Amazing so far!"
  }'
```

### 5. Update Reading Status

Update only the reading status of a book.

**Endpoint:** `PATCH /api/user-books/{id}/status`

**Query Parameters:**
- `status`: New reading status (want-to-read, currently-reading, read, did-not-finish)

**Example:**
```bash
curl -X PATCH "http://localhost:8081/api/user-books/1/status?status=read" \
  -H "Authorization: Bearer <token>"
```

**Behavior:**
- Setting to `CURRENTLY_READING`: Sets `startedAt` to now
- Setting to `READ`: Sets `finishedAt` to now
- Automatically updates timestamps

### 6. Mark as Did Not Finish

Mark a book as DNF with an optional reason.

**Endpoint:** `POST /api/user-books/{id}/dnf`

**Query Parameters:**
- `reason` (optional): Reason for not finishing

**Example:**
```bash
curl -X POST "http://localhost:8081/api/user-books/1/dnf?reason=Lost%20interest" \
  -H "Authorization: Bearer <token>"
```

**Behavior:**
- Sets status to `DID_NOT_FINISH`
- Sets `dnfDate` to now
- Saves the reason

### 7. Remove Book from Shelf

Delete a book from the user's shelf.

**Endpoint:** `DELETE /api/user-books/{id}`

**Example:**
```bash
curl -X DELETE http://localhost:8081/api/user-books/1 \
  -H "Authorization: Bearer <token>"
```

**Response:** 204 No Content

---

## Reading Sessions API

Track individual reading sessions with pages/minutes read.

### 1. Log Reading Session

Record a new reading session.

**Endpoint:** `POST /api/reading-sessions`

**Request Body:**
```json
{
  "bookId": 42,
  "pagesRead": 25,
  "minutesRead": 45,
  "readingMethod": "PHYSICAL",
  "sessionDate": "2024-12-03",
  "startPage": 45,
  "endPage": 70,
  "notes": "Read on the train"
}
```

**Required Fields:**
- `bookId`: ID of the book
- `readingMethod`: PHYSICAL, EBOOK, or AUDIOBOOK
- For AUDIOBOOK: `minutesRead` is required
- For PHYSICAL/EBOOK: `pagesRead` is required

**Optional Fields:**
- `sessionDate`: Date of session (defaults to today)
- `startPage`: Starting page number
- `endPage`: Ending page number
- `notes`: Session notes

**Example:**
```bash
curl -X POST http://localhost:8081/api/reading-sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": 42,
    "pagesRead": 25,
    "minutesRead": 30,
    "readingMethod": "PHYSICAL",
    "startPage": 45,
    "endPage": 70
  }'
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "bookId": 42,
  "book": {
    "id": 42,
    "title": "The Great Gatsby",
    "coverUrl": "https://...",
    "authorNames": ["F. Scott Fitzgerald"]
  },
  "pagesRead": 25,
  "minutesRead": 30,
  "readingMethod": "PHYSICAL",
  "sessionDate": "2024-12-03",
  "startPage": 45,
  "endPage": 70,
  "notes": null,
  "createdAt": "2024-12-03T16:00:00Z"
}
```

**Auto-Progress Update:**
When a session is logged, if a UserBook exists for this book, its progress is automatically updated:
- For audiobooks: `currentSeconds` is incremented by `minutesRead * 60`
- For physical/ebook: `currentPage` is updated to `endPage` or incremented by `pagesRead`

### 2. Get Specific Session

**Endpoint:** `GET /api/reading-sessions/{id}`

**Example:**
```bash
curl http://localhost:8081/api/reading-sessions/1 \
  -H "Authorization: Bearer <token>"
```

### 3. Get Recent Sessions

Retrieve recent reading sessions for the user.

**Endpoint:** `GET /api/reading-sessions`

**Query Parameters:**
- `limit` (optional): Number of sessions to retrieve (default: 20)

**Example:**
```bash
curl http://localhost:8081/api/reading-sessions?limit=10 \
  -H "Authorization: Bearer <token>"
```

**Response:** Array of reading session objects, ordered by date (most recent first).

### 4. Get Sessions for a Book

Retrieve all reading sessions for a specific book.

**Endpoint:** `GET /api/reading-sessions/book/{bookId}`

**Example:**
```bash
curl http://localhost:8081/api/reading-sessions/book/42 \
  -H "Authorization: Bearer <token>"
```

### 5. Get Reading Statistics

Retrieve user's reading statistics.

**Endpoint:** `GET /api/reading-sessions/stats`

**Example:**
```bash
curl http://localhost:8081/api/reading-sessions/stats \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "userId": 1,
  "sessionsThisWeek": 5,
  "pagesThisWeek": 125,
  "minutesThisWeek": 180,
  "sessionsThisMonth": 22,
  "pagesThisMonth": 450,
  "minutesThisMonth": 720,
  "currentlyReadingCount": 3,
  "readCount": 15,
  "wantToReadCount": 42,
  "didNotFinishCount": 2,
  "preferredMethod": "PHYSICAL"
}
```

**Statistics Include:**
- **This Week/Month**: Sessions, pages, and minutes in the last 7/30 days
- **Book Counts**: Number of books in each reading status
- **Preferred Method**: Most frequently used reading method (based on last 20 sessions)

### 6. Delete Session

**Endpoint:** `DELETE /api/reading-sessions/{id}`

**Example:**
```bash
curl -X DELETE http://localhost:8081/api/reading-sessions/1 \
  -H "Authorization: Bearer <token>"
```

**Response:** 204 No Content

---

## Lists API

Create and manage custom book lists.

### 1. Create List

Create a new custom list.

**Endpoint:** `POST /api/lists`

**Request Body:**
```json
{
  "name": "Summer Reading 2024",
  "description": "Books to read this summer",
  "isPublic": true
}
```

**Required Fields:**
- `name`: List name

**Optional Fields:**
- `description`: List description
- `isPublic`: Whether list is public (default: false)

**Example:**
```bash
curl -X POST http://localhost:8081/api/lists \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Favorite Sci-Fi",
    "description": "My favorite science fiction novels",
    "isPublic": true
  }'
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "name": "Favorite Sci-Fi",
  "description": "My favorite science fiction novels",
  "isPublic": true,
  "isDefault": false,
  "listType": "CUSTOM",
  "bookCount": 0,
  "books": null,
  "createdAt": "2024-12-03T16:00:00Z",
  "updatedAt": "2024-12-03T16:00:00Z"
}
```

### 2. Get User's Lists

Retrieve all lists for the authenticated user.

**Endpoint:** `GET /api/lists`

**Example:**
```bash
curl http://localhost:8081/api/lists \
  -H "Authorization: Bearer <token>"
```

**Response:** Array of list objects (without books).

### 3. Get Specific List

Retrieve a specific list with optional books.

**Endpoint:** `GET /api/lists/{id}`

**Query Parameters:**
- `includeBooks` (optional): Include book details (default: false)

**Example:**
```bash
curl "http://localhost:8081/api/lists/1?includeBooks=true" \
  -H "Authorization: Bearer <token>"
```

**Response (with includeBooks=true):**
```json
{
  "id": 1,
  "userId": 1,
  "name": "Favorite Sci-Fi",
  "description": "My favorite science fiction novels",
  "isPublic": true,
  "isDefault": false,
  "listType": "CUSTOM",
  "bookCount": 2,
  "books": [
    {
      "id": 42,
      "title": "Dune",
      "coverUrl": "https://...",
      "authorNames": ["Frank Herbert"],
      "pageCount": 688
    },
    {
      "id": 43,
      "title": "Neuromancer",
      "coverUrl": "https://...",
      "authorNames": ["William Gibson"],
      "pageCount": 271
    }
  ],
  "createdAt": "2024-12-03T16:00:00Z",
  "updatedAt": "2024-12-03T16:05:00Z"
}
```

**Authorization:**
- User can access their own lists (public or private)
- User can access other users' public lists

### 4. Update List

Update list details (name, description, visibility).

**Endpoint:** `PUT /api/lists/{id}`

**Request Body:** Same as POST

**Example:**
```bash
curl -X PUT http://localhost:8081/api/lists/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Best Sci-Fi Ever",
    "description": "Updated description",
    "isPublic": false
  }'
```

**Restrictions:**
- Cannot modify default lists (Currently Reading, To Be Read)
- User must own the list

### 5. Delete List

Soft delete a list (sets `deletedAt` timestamp).

**Endpoint:** `DELETE /api/lists/{id}`

**Example:**
```bash
curl -X DELETE http://localhost:8081/api/lists/1 \
  -H "Authorization: Bearer <token>"
```

**Response:** 204 No Content

**Restrictions:**
- Cannot delete default lists
- User must own the list

### 6. Add Book to List

Add a book to a list.

**Endpoint:** `POST /api/lists/{id}/books/{bookId}`

**Example:**
```bash
curl -X POST http://localhost:8081/api/lists/1/books/42 \
  -H "Authorization: Bearer <token>"
```

**Response:** 201 Created

**Behavior:**
- Book is added at the end of the list (highest order number)
- Returns 409 Conflict if book is already in the list
- Returns 404 if book doesn't exist in tome-content

### 7. Remove Book from List

Remove a book from a list.

**Endpoint:** `DELETE /api/lists/{id}/books/{bookId}`

**Example:**
```bash
curl -X DELETE http://localhost:8081/api/lists/1/books/42 \
  -H "Authorization: Bearer <token>"
```

**Response:** 204 No Content

### 8. Reorder Books in List

Change the order of books in a list.

**Endpoint:** `PUT /api/lists/{id}/books/order`

**Request Body:**
```json
[42, 45, 43, 44]
```

Send an array of book IDs in the desired order.

**Example:**
```bash
curl -X PUT http://localhost:8081/api/lists/1/books/order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '[42, 45, 43, 44]'
```

**Validation:**
- All provided book IDs must already be in the list
- Returns 400 if any book ID is not in the list

### 9. Get Default List

Retrieve a user's default list by type.

**Endpoint:** `GET /api/lists/default/{type}`

**Path Parameters:**
- `type`: `currently-reading` or `to-be-read`

**Example:**
```bash
curl http://localhost:8081/api/lists/default/currently-reading \
  -H "Authorization: Bearer <token>"
```

**Response:** List object for the default list.

**Behavior:**
- Default lists are auto-created for new users (via database trigger)
- If a default list doesn't exist, it will be created on-demand
- Default lists cannot be deleted or have their metadata modified (but can have books added/removed)

---

## Error Responses

All endpoints return appropriate HTTP status codes and error messages.

### Common Error Codes

**401 Unauthorized**
```json
{
  "timestamp": "2024-12-03T16:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/api/user-books"
}
```

**403 Forbidden**
```json
{
  "timestamp": "2024-12-03T16:00:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Cannot access private list",
  "path": "/api/lists/5"
}
```

**404 Not Found**
```json
{
  "timestamp": "2024-12-03T16:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "UserBook not found with id: 999",
  "path": "/api/user-books/999"
}
```

**409 Conflict**
```json
{
  "timestamp": "2024-12-03T16:00:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Book is already in this list",
  "path": "/api/lists/1/books/42"
}
```

**400 Bad Request (Validation Error)**
```json
{
  "timestamp": "2024-12-03T16:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": {
    "personalRating": "must be less than or equal to 5",
    "bookId": "must not be null"
  },
  "path": "/api/user-books"
}
```

---

## Data Models

### Enums

**ReadingStatus:**
- `WANT_TO_READ`: Want to read
- `CURRENTLY_READING`: Currently reading
- `READ`: Completed
- `DID_NOT_FINISH`: Did not finish

**ReadingMethod:**
- `PHYSICAL`: Physical book
- `EBOOK`: E-book
- `AUDIOBOOK`: Audiobook

**ListType:**
- `CUSTOM`: User-created list
- `CURRENTLY_READING`: Default currently reading list
- `TO_BE_READ`: Default to-be-read list

---

## Notes

### Progress Calculation

Progress percentage is calculated based on:
- **Physical/E-book**: `(currentPage / effectivePageCount) * 100`
- **Audiobook**: `(currentSeconds / effectiveAudioLength) * 100`

The "effective" page count or audio length uses the user's override values if set, otherwise the book's default values.

Progress is capped at 100%.

### Default Lists

Every user automatically has two default lists created:
1. **Currently Reading** (type: CURRENTLY_READING)
2. **To Be Read** (type: TO_BE_READ)

These lists:
- Are created via database trigger when a user is created
- Cannot be deleted
- Cannot have their name/description modified
- Can have books added/removed normally

### Service-to-Service Communication

The tome-user-data service communicates with tome-content to fetch book details:
- Uses RestTemplate with 5-second timeout
- Results are cached for 1 hour using Caffeine
- Circuit breaker pattern with Resilience4j
- Fallback returns partial data if tome-content is unavailable

### Authorization

All operations are scoped to the authenticated user:
- Users can only access/modify their own data
- Exception: Public lists can be viewed by anyone (but only owner can modify)
- The userId is extracted from the JWT token and validated on every request
