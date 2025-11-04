# External API Integration Guide

This document explains how to integrate external book data APIs (Hardcover, Google Books, Open Library) with Tome's UUID-based database.

## Overview

Tome uses **UUIDs** for internal book and author IDs, but external APIs use their own ID systems. To bridge this gap, we store:
- `id` (UUID): Our internal unique identifier
- `external_id` (String): The external API's ID for this book/author
- `external_source` (String): Which API the external_id comes from

## Supported External Sources

- `hardcover` - Hardcover API
- `google_books` - Google Books API
- `open_library` - Open Library API
- `goodreads` - Goodreads API (if available)

## Database Schema

### Books Table
```sql
CREATE TABLE books (
    id UUID PRIMARY KEY,                    -- Internal UUID
    title VARCHAR(500),
    isbn_10 VARCHAR(10),
    isbn_13 VARCHAR(13),
    -- ... other fields ...
    external_id VARCHAR(255),               -- External API ID
    external_source VARCHAR(50),            -- 'hardcover', 'google_books', etc.
    -- ...
);

-- Prevents duplicate imports from same source
CREATE UNIQUE INDEX idx_books_external_unique
ON books(external_source, external_id)
WHERE external_source IS NOT NULL AND external_id IS NOT NULL;
```

### Authors Table
```sql
CREATE TABLE authors (
    id UUID PRIMARY KEY,                    -- Internal UUID
    name VARCHAR(255),
    -- ... other fields ...
    external_id VARCHAR(255),               -- External API ID
    external_source VARCHAR(50),            -- 'hardcover', 'google_books', etc.
    -- ...
);
```

## Integration Workflow

### 1. Importing a Book from Hardcover API

```java
// Example: Importing a book from Hardcover
public Book importFromHardcover(String hardcoverId) {
    // Step 1: Check if book already exists
    Optional<Book> existing = bookRepository
        .findByExternalSourceAndExternalId("hardcover", hardcoverId);

    if (existing.isPresent()) {
        return existing.get(); // Already imported
    }

    // Step 2: Fetch data from Hardcover API
    HardcoverBook hardcoverBook = hardcoverApiClient.getBook(hardcoverId);

    // Step 3: Create new book with UUID
    Book book = new Book();
    book.setId(UUID.randomUUID());           // Generate internal UUID
    book.setExternalId(hardcoverId);          // Store Hardcover ID
    book.setExternalSource("hardcover");      // Mark source
    book.setTitle(hardcoverBook.getTitle());
    book.setIsbn10(hardcoverBook.getIsbn10());
    book.setIsbn13(hardcoverBook.getIsbn13());
    // ... map other fields ...

    // Step 4: Handle authors
    for (HardcoverAuthor hcAuthor : hardcoverBook.getAuthors()) {
        Author author = importAuthorFromHardcover(hcAuthor);
        book.addAuthor(author);
    }

    // Step 5: Handle genres
    for (String genreName : hardcoverBook.getGenres()) {
        Genre genre = genreRepository.findByName(genreName)
            .orElseGet(() -> createGenre(genreName));
        book.addGenre(genre);
    }

    return bookRepository.save(book);
}

private Author importAuthorFromHardcover(HardcoverAuthor hcAuthor) {
    // Check if author already exists
    Optional<Author> existing = authorRepository
        .findByExternalSourceAndExternalId("hardcover", hcAuthor.getId());

    if (existing.isPresent()) {
        return existing.get();
    }

    // Create new author
    Author author = new Author();
    author.setId(UUID.randomUUID());
    author.setExternalId(hcAuthor.getId());
    author.setExternalSource("hardcover");
    author.setName(hcAuthor.getName());
    author.setBio(hcAuthor.getBio());
    // ... map other fields ...

    return authorRepository.save(author);
}
```

### 2. Required Repository Methods

```java
public interface BookRepository extends JpaRepository<Book, UUID> {

    Optional<Book> findByExternalSourceAndExternalId(
        String externalSource,
        String externalId
    );

    Optional<Book> findByIsbn13(String isbn13);

    Optional<Book> findByIsbn10(String isbn10);

    List<Book> findByExternalSource(String externalSource);
}

public interface AuthorRepository extends JpaRepository<Author, UUID> {

    Optional<Author> findByExternalSourceAndExternalId(
        String externalSource,
        String externalId
    );

    Optional<Author> findByName(String name);
}
```

### 3. Search Integration Example

When users search for books, you might want to:
1. Search your local database first
2. If no results, search Hardcover API
3. Import results and return them

```java
public List<Book> searchBooks(String query) {
    // Step 1: Search local database
    List<Book> localResults = bookRepository.searchByTitle(query);

    if (!localResults.isEmpty()) {
        return localResults;
    }

    // Step 2: Search Hardcover API
    List<HardcoverBook> apiResults = hardcoverApiClient.search(query);

    // Step 3: Import and return
    return apiResults.stream()
        .map(hcBook -> importFromHardcover(hcBook.getId()))
        .collect(Collectors.toList());
}
```

## Hardcover API Specifics

### API Endpoint
```
GraphQL: https://hardcover.app/graphql
```

### Sample GraphQL Query
```graphql
query GetBook($id: Int!) {
  book(id: $id) {
    id
    title
    subtitle
    description
    pages
    publishedDate
    language {
      name
    }
    publisher {
      name
    }
    isbn10
    isbn13
    image
    authors {
      id
      name
      bio
      image
    }
    genres {
      name
    }
  }
}
```

### Sample Search Query
```graphql
query SearchBooks($query: String!) {
  books(where: { title: { contains: $query } }) {
    id
    title
    subtitle
    authors {
      id
      name
    }
    image
    isbn13
  }
}
```

## Handling Multiple API Sources

You can import the same book from different sources if needed:

```sql
-- Example: Same book from different sources
INSERT INTO books VALUES
  (gen_random_uuid(), 'The Great Gatsby', '9780743273565', 'hardcover', '12345', ...),
  (gen_random_uuid(), 'The Great Gatsby', '9780743273565', 'google_books', 'xyz789', ...);
```

However, **it's recommended to use ISBN as the primary deduplication key** to avoid duplicates:

```java
public Book importBook(ExternalBook externalBook) {
    // First, try to find by ISBN
    Optional<Book> byIsbn = bookRepository.findByIsbn13(externalBook.getIsbn13());

    if (byIsbn.isPresent()) {
        Book existing = byIsbn.get();
        // Update external_id if from different source
        if (!externalBook.getSource().equals(existing.getExternalSource())) {
            // Maybe log or store in a separate mapping table
        }
        return existing;
    }

    // Then check by external ID
    Optional<Book> byExternal = bookRepository
        .findByExternalSourceAndExternalId(
            externalBook.getSource(),
            externalBook.getExternalId()
        );

    if (byExternal.isPresent()) {
        return byExternal.get();
    }

    // Create new book
    return createNewBook(externalBook);
}
```

## Best Practices

### 1. Use ISBN as Primary Deduplication
Since books can exist in multiple APIs, use ISBN-13 (or ISBN-10) as the primary way to prevent duplicates.

### 2. Store External IDs for Syncing
Keep `external_id` and `external_source` for:
- Re-syncing data (updating book details)
- Linking back to external API
- API-specific features (e.g., Hardcover reviews)

### 3. Handle Missing ISBNs
Some books (especially older ones) might not have ISBNs. In these cases:
- Use title + author matching with fuzzy search
- Consider using OCLC numbers or other identifiers
- Allow manual deduplication by admins

### 4. Sync Updates
Periodically update book data from external APIs:

```java
@Scheduled(cron = "0 0 2 * * *") // 2 AM daily
public void syncBooksFromHardcover() {
    List<Book> hardcoverBooks = bookRepository
        .findByExternalSource("hardcover");

    for (Book book : hardcoverBooks) {
        try {
            HardcoverBook updated = hardcoverApiClient
                .getBook(book.getExternalId());

            // Update fields that might have changed
            book.setDescription(updated.getDescription());
            book.setCoverUrl(updated.getImage());
            // ... update other fields ...

            bookRepository.save(book);
        } catch (Exception e) {
            logger.error("Failed to sync book: " + book.getId(), e);
        }
    }
}
```

### 5. API Rate Limiting
Implement rate limiting and caching:

```java
@Cacheable(value = "hardcoverBooks", key = "#hardcoverId")
public Book getOrImportFromHardcover(String hardcoverId) {
    return importFromHardcover(hardcoverId);
}
```

## Example API Responses

### Hardcover Book Response (Simplified)
```json
{
  "data": {
    "book": {
      "id": 12345,
      "title": "Project Hail Mary",
      "subtitle": null,
      "isbn10": "0593135202",
      "isbn13": "9780593135204",
      "pages": 496,
      "publishedDate": "2021-05-04",
      "description": "A lone astronaut must save the earth...",
      "image": "https://hardcover.app/covers/12345.jpg",
      "language": { "name": "English" },
      "publisher": { "name": "Ballantine Books" },
      "authors": [
        {
          "id": 678,
          "name": "Andy Weir",
          "bio": "Andy Weir built a career...",
          "image": "https://hardcover.app/authors/678.jpg"
        }
      ],
      "genres": [
        { "name": "Science Fiction" },
        { "name": "Adventure" }
      ]
    }
  }
}
```

## Reference: Entity Relationships

```
External API (Hardcover)
         |
         | API Call (by external_id)
         |
         v
   +------------+
   |   Book     |
   | (UUID id)  |<--- Your internal UUID
   | external_id|<--- Hardcover's ID (12345)
   |external_src|<--- 'hardcover'
   +------------+
```

## Summary

- ✅ Use **UUIDs** for all internal references
- ✅ Store **external_id** and **external_source** for API mapping
- ✅ Use **ISBN** as primary deduplication key
- ✅ Create unique index on `(external_source, external_id)` to prevent duplicate imports
- ✅ Implement sync jobs to keep data fresh
- ✅ Cache API responses to reduce API calls
- ✅ Handle missing ISBNs gracefully

This approach gives you the best of both worlds: clean internal UUIDs and seamless external API integration!
