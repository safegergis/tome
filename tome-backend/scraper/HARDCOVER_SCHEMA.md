# Hardcover API Schema Reference

This document outlines the schema for the Hardcover API, which will be used for scraping book data.

## Table of Contents
- [Author Schema](#author-schema)
- [Edition Schema](#edition-schema)
- [Publisher Schema](#publisher-schema)
- [Book Schema](#book-schema)

---

## Author Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | The unique identifier of the author |
| `name` | String | The name of the author |
| `slug` | String | The Hardcover URL slug |
| `alternate_names` | Array of Strings | Alternate names for the author |
| `bio` | String | The biography of the author |
| `books_count` | Int | The number of books the author has contributed to |
| `born_date` | Date | The date the author was born |
| `born_year` | Int | The year the author was born |
| `death_date` | Date | The date the author died |
| `death_year` | Int | The year the author died |
| `cached_image` | Object | Metadata for the author's image (includes image id, url, primary color, width, and height) |
| `contributions` | Contribution | The contributions the author is listed on |
| `identifiers` | Array of Objects | IDs for the author on other platforms |
| `is_bipoc` | Boolean | Whether the author is Black, Indigenous, or a Person of Color |
| `is_lgbtq` | Boolean | Whether the author is LGBTQ+ |

---

## Edition Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Unique identifier for the edition |
| `title` | String | Title of this edition |
| `subtitle` | String | Subtitle of this edition |
| `isbn_10` | String | 10-digit ISBN |
| `isbn_13` | String | 13-digit ISBN |
| `asin` | String | Amazon Standard Identification Number |
| `pages` | Int | Number of pages |
| `audio_seconds` | Int | Duration in seconds (for audiobooks) |
| `release_date` | Date | Full release date |
| `release_year` | Int | Year of release |
| `physical_format` | String | Physical format (hardcover, paperback, etc.) |
| `edition_format` | String | Edition format information |
| `edition_information` | String | Additional edition details |
| `description` | String | Description of this edition |
| `book_id` | Int | ID of the parent book |
| `publisher_id` | Int | ID of the publisher |
| `language_id` | Int | ID of the language |
| `country_id` | Int | ID of the country of publication |
| `reading_format_id` | Int | ID of the reading format |
| `image_id` | Int | ID of the cover image |
| `rating` | Numeric | Average rating for this edition |
| `users_count` | Int | Number of users who have this edition |
| `users_read_count` | Int | Number of users who have read this edition |
| `lists_count` | Int | Number of lists containing this edition |
| `locked` | Bool | Whether the edition is locked from editing |
| `state` | String | Current state of the edition record |
| `created_at` | Timestamp | When the edition was created |
| `updated_at` | Timestamp | When the edition was last updated |
| `book` | Book | Parent book object |
| `publisher` | Publisher | Publisher object |
| `language` | Language | Language object |
| `country` | Country | Country object |
| `reading_format` | ReadingFormat | Reading format object |
| `image` | Image | Cover image object |
| `contributions` | Contribution[] | Array of contributor relationships |

---

## Publisher Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | BigInt | Unique identifier for the publisher |
| `name` | String | The name of the publisher |
| `slug` | String | URL-friendly identifier for the publisher |
| `canonical_id` | Int | Canonical ID for merged publishers |
| `parent_id` | Int | ID of the parent publisher (for imprints) |
| `editions_count` | Int | Number of editions published by this publisher |
| `locked` | Bool | Whether the publisher is locked from editing |
| `state` | String | Current state of the publisher record |
| `user_id` | Int | ID of the user who created the publisher |
| `created_at` | Timestamp | When the publisher was created |
| `updated_at` | Timestamp | When the publisher was last updated |
| `editions` | Edition[] | Array of editions published by this publisher |
| `parent_publisher` | Publisher | Parent publisher object (for imprints) |

---

## Book Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Unique identifier for the book |
| `title` | String | Title of the book |
| `subtitle` | String | Subtitle of the book |
| `slug` | String | URL-friendly identifier |
| `description` | String | Book description |
| `release_date` | Date | Release date |
| `release_date_i` | Auto | Release date (indexed) |
| `release_year` | Int | Year of release |
| `rating` | Float | Average rating |
| `pages` | Int | Number of pages |
| `audio_seconds` | Auto | Duration in seconds (for audiobooks) |
| `compilation` | Bool | Whether the book is a compilation |
| `users_count` | Int32 | Number of users who have this book |
| `users_read_count` | Int32 | Number of users who have read this book |
| `lists_count` | Int32 | Number of lists containing this book |
| `ratings_count` | Int32 | Number of ratings |
| `reviews_count` | Int32 | Number of reviews |
| `journals_count` | Int | Number of journal entries |
| `editions_count` | Int | Number of editions |
| `prompts_count` | Int32 | Number of prompts |
| `activities_count` | Int32 | Number of activities |
| `author_names` | String[] | Array of author names |
| `alternative_titles` | String[] | Alternative titles |
| `isbns` | String[] | Array of ISBNs |
| `cover_color` | Auto | Cover color |
| `genres` | String[] | Array of genres |
| `moods` | String[] | Array of moods |
| `content_warnings` | String[] | Array of content warnings |
| `tags` | String[] | Array of tags |
| `series_names` | String[] | Array of series names |
| `contribution_types` | String[] | Types of contributions |
| `links` | String[] | External links |
| `dto` | String[] | Data transfer object |
| `dto_combined` | String[] | Combined DTO |
| `dto_external` | String[] | External DTO |
| `ratings_distribution` | String[] | Distribution of ratings |
| `has_audiobook` | Bool | Whether an audiobook exists |
| `has_ebook` | Bool | Whether an ebook exists |
| `user_added` | Bool | Whether added by a user |
| `locked` | Bool | Whether the book is locked from editing |
| `state` | String | Current state of the book record |
| `headline` | String | Headline text |
| `canonical_id` | Int | Canonical ID for merged books |
| `book_category_id` | Int | Category ID |
| `literary_type_id` | Int | Literary type ID |
| `featured_series_id` | Int | Featured series ID |
| `import_platform_id` | Int | Import platform ID |
| `header_image_id` | Int | Header image ID |
| `created_by_user_id` | Int | User who created the book |
| `default_audio_edition_id` | Int | Default audio edition ID |
| `default_cover_edition_id` | Int | Default cover edition ID |
| `default_ebook_edition_id` | Int | Default ebook edition ID |
| `default_physical_edition_id` | Int | Default physical edition ID |
| `created_at` | Timestamp | When the book was created |
| `updated_at` | Timestamptz | When the book was last updated |
| `contributions` | Contributions[] | Array of contributor relationships |
| `image` | Auto/Images[] | Cover image(s) |
| `book_characters` | Characters | Book characters |
| `book_mappings` | Book_Mappings[] | Book mappings |
| `book_series` | Book_Series[] | Series the book belongs to |
| `book_status` | Book_Statuses | Status of the book |
| `canonical` | Books | Canonical book reference |
| `default_audio_edition` | Editions | Default audio edition |
| `default_cover_edition` | Editions | Default cover edition |
| `default_ebook_edition` | Editions | Default ebook edition |
| `default_physical_edition` | Editions | Default physical edition |
| `editions` | Editions | Editions of the book |
| `featured_book_series` | Book_Series | Featured series |
| `list_books` | List_Books[] | List associations |
| `prompt_answers` | Prompt_Answers[] | Prompt answers |
| `prompt_summaries` | Prompt_Books_Summary[] | Prompt summaries |
| `recommendations` | Recommendations[] | Recommendations |
| `taggable_counts` | Taggable_Counts[] | Taggable counts |
| `taggings` | Taggings[] | Tag associations |
| `user_books` | User_Books[] | User book relationships |

---

## Notes for Scraper Implementation

### Priority Fields for Initial Import

**Authors:**
- `id`, `name`, `bio`, `born_year`, `death_year`

**Editions:**
- `id`, `title`, `subtitle`, `isbn_10`, `isbn_13`, `pages`, `release_date`, `description`, `book_id`, `publisher_id`

**Publishers:**
- `id`, `name`

**Books:**
- `id`, `title`, `subtitle`, `description`, `release_date`, `rating`, `pages`, `author_names`, `genres`, `isbns`

### API Limitations and Constraints

**Rate Limiting:**
- **60 requests per minute** - Implement rate limiting with delays between requests
- Queries have a **maximum timeout of 30 seconds**
- Recommendation: Add ~1 second delay between requests to stay well under the limit

**Token Management:**
- API tokens automatically **expire after 1 year**
- Tokens **reset on January 1st** each year
- Tokens must be kept **secure** - cannot run queries in browser

**Query Restrictions:**
- **Maximum query depth: 3** (as of 2025)
- **Disabled query operators:**
  - `_like`, `_nlike`
  - `_ilike`, `_nilike`
  - `_regex`, `_nregex`
  - `_iregex`, `_niregex`
  - `_similar`, `_nsimilar`
- Use exact matches, `_eq`, `_in`, etc. instead

**Data Access (2025):**
- Limited to:
  - Your own user data
  - Public data only
  - User data of users you follow
- OAuth support coming for external applications

### API Considerations
- Some fields are auto-generated or calculated
- Nested objects (like `contributions`, `editions`) may require separate API calls
- Consider using `slug` fields for URL construction
- Implement pagination for large result sets
- Add retry logic with exponential backoff for rate limit errors
