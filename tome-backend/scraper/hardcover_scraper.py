#!/usr/bin/env python3
"""
Hardcover Book Scraper
Continuously scrapes popular books from Hardcover API and imports to database
"""

import os
import sys
import time
import logging
import requests
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from dotenv import load_dotenv
import signal
import json

# Load environment variables
load_dotenv("../.env")

# Configuration
API_BASE_URL = "https://api.hardcover.app/v1/graphql"
API_TOKEN = os.getenv("HARDCOVER_API_TOKEN")
REQUESTS_PER_MINUTE = 60
REQUEST_DELAY = 60.0 / REQUESTS_PER_MINUTE  # ~1 second between requests
TARGET_BOOKS_LIMIT = int(os.getenv("TARGET_BOOKS_LIMIT", "5000"))
BOOKS_PER_BATCH = int(os.getenv("BOOKS_PER_BATCH", "50"))

# Business logic constants
MIN_GENRE_TAG_COUNT = 20 # Minimum tag count for genre to be included
ISBN_10_LENGTH = 10
ISBN_13_LENGTH = 13
SUPPORTED_LANGUAGES = {"english", "en"}
RETRY_DELAY_SECONDS = 60  # Delay before retrying when no books found
BATCH_DELAY_SECONDS = 2  # Delay between batches

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "tomedb"),
    "user": os.getenv("DB_USER", "myuser"),
    "password": os.getenv("DB_PASSWORD", "secret"),
    "port": os.getenv("DB_PORT", "5432"),
}

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "hardcover_scraper.log")

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("HardcoverScraper")


class RateLimiter:
    """Simple rate limiter to ensure we don't exceed API limits"""

    def __init__(self, requests_per_minute: int):
        self.delay = 60.0 / requests_per_minute
        self.last_request_time = 0

    def wait(self):
        """Wait if necessary to maintain rate limit"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time

        if time_since_last < self.delay:
            sleep_time = self.delay - time_since_last
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f}s")
            time.sleep(sleep_time)

        self.last_request_time = time.time()


class HardcoverAPI:
    """
    Handles all Hardcover API interactions with rate limiting.

    This class manages GraphQL queries to the Hardcover API, respecting
    rate limits and handling request errors gracefully.
    """

    def __init__(self, api_token: str, rate_limiter: RateLimiter):
        self.api_token = api_token
        self.rate_limiter = rate_limiter
        self.session = requests.Session()
        self.session.headers.update(
            {"Authorization": f"Bearer {api_token}", "Content-Type": "application/json"}
        )

    def _make_request(
        self, query: str, variables: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make a GraphQL request to Hardcover API"""
        try:
            response = self.session.post(
                API_BASE_URL,
                json={"query": query, "variables": variables or {}},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                logger.error(f"GraphQL errors: {data['errors']}")
                return None

            return data.get("data")

        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return None

    def get_popular_books_with_editions(
        self, limit: int = 100, offset: int = 0
    ) -> Optional[List[Dict]]:
        """Get popular books with their edition details in a single query"""
        query = """
        query GetPopularBooksWithEditions($limit: Int! = 100, $offset: Int! = 0) {
            books(
                limit: $limit
                offset: $offset
                order_by: {users_count: desc}
            ) {
                id
                title
                slug
                cached_tags
                description
                default_physical_edition {
                    id
                    title
                    subtitle
                    isbn_10
                    isbn_13
                    pages
                    release_date
                    release_year
                    book_id
                    publisher {
                        id
                        name
                    }
                    language {
                        id
                        language
                    }
                    contributions {
                        author {
                            id
                            name
                            bio
                            born_year
                            death_year
                        }
                    }
                }
                default_audio_edition {
                    audio_seconds
                }
                default_ebook_edition {
                    pages
                }
            }
        }
        """

        variables = {"limit": limit, "offset": offset}
        data = self._make_request(query, variables)
        return data.get("books", []) if data else []


class DatabaseManager:
    """
    Handles all database operations with caching for performance.

    This class manages PostgreSQL connections, book/author/genre imports,
    and scraper run tracking. It includes in-memory caching for frequently
    accessed data like genres and authors to minimize database queries.
    """

    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.conn = None
        self.cursor = None
        self.current_run_id = None
        # Performance optimization: cache genre lookups to avoid repeated DB queries
        self._genre_cache: Dict[str, int] = {}  # genre_name -> genre_id
        self._author_cache: Dict[int, int] = {}  # hardcover_id -> author_id

    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            logger.info("Database connected successfully")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise

    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("Database disconnected")

    def get_last_incomplete_run(self) -> Optional[Dict]:
        """Get the last incomplete scraper run (running or stopped)"""
        try:
            self.cursor.execute("""
                SELECT id, last_offset, last_hardcover_book_id
                FROM scraper_runs
                WHERE status IN ('running', 'stopped')
                ORDER BY started_at DESC
                LIMIT 1
            """)
            return self.cursor.fetchone()
        except Exception as e:
            logger.error(f"Failed to get last incomplete run: {e}")
            return None

    def start_scraper_run(self, resume_run_id: Optional[int] = None) -> int:
        """Start a new scraper run or resume an existing one, return the run ID (BIGINT)"""
        try:
            if resume_run_id:
                # Resume existing run
                self.cursor.execute(
                    """
                    UPDATE scraper_runs
                    SET status = 'running',
                        started_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id
                """,
                    (resume_run_id,),
                )
                self.current_run_id = self.cursor.fetchone()["id"]
                logger.info(f"Resuming scraper run: {self.current_run_id}")
            else:
                # Start new run
                self.cursor.execute("""
                    INSERT INTO scraper_runs (status)
                    VALUES ('running')
                    RETURNING id
                """)
                self.current_run_id = self.cursor.fetchone()["id"]
                logger.info(f"Started scraper run: {self.current_run_id}")

            self.conn.commit()
            return self.current_run_id
        except Exception as e:
            logger.error(f"Failed to start scraper run: {e}")
            self.conn.rollback()
            raise

    def end_scraper_run(self, status: str, notes: Optional[str] = None):
        """Mark the current scraper run as ended"""
        if not self.current_run_id:
            return

        try:
            self.cursor.execute(
                """
                UPDATE scraper_runs
                SET ended_at = NOW(),
                    status = %s,
                    notes = %s
                WHERE id = %s
            """,
                (status, notes, self.current_run_id),
            )
            self.conn.commit()
            logger.info(
                f"Ended scraper run {self.current_run_id} with status: {status}"
            )
        except Exception as e:
            logger.error(f"Failed to end scraper run: {e}")
            self.conn.rollback()

    def update_run_stats(
        self,
        books_processed: int = 0,
        editions_imported: int = 0,
        authors_imported: int = 0,
        errors_count: int = 0,
        last_hardcover_book_id: Optional[int] = None,
        last_offset: Optional[int] = None,
    ):
        """Update statistics for current scraper run"""
        if not self.current_run_id:
            return

        try:
            # Build dynamic query based on what's provided
            updates = []
            params = []

            if books_processed > 0:
                updates.append("books_processed = books_processed + %s")
                params.append(books_processed)

            if editions_imported > 0:
                updates.append("editions_imported = editions_imported + %s")
                params.append(editions_imported)

            if authors_imported > 0:
                updates.append("authors_imported = authors_imported + %s")
                params.append(authors_imported)

            if errors_count > 0:
                updates.append("errors_count = errors_count + %s")
                params.append(errors_count)

            if last_hardcover_book_id is not None:
                updates.append("last_hardcover_book_id = %s")
                params.append(last_hardcover_book_id)

            if last_offset is not None:
                updates.append("last_offset = %s")
                params.append(last_offset)

            if not updates:
                return

            params.append(self.current_run_id)
            query = f"""
                UPDATE scraper_runs
                SET {", ".join(updates)}
                WHERE id = %s
            """

            self.cursor.execute(query, params)
            self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to update run stats: {e}")
            self.conn.rollback()

    def log_error(
        self,
        error_type: str,
        hardcover_id: Optional[int],
        hardcover_type: str,
        error_message: str,
        stack_trace: Optional[str] = None,
    ):
        """Log an error to the database"""
        try:
            self.cursor.execute(
                """
                INSERT INTO scraper_errors (
                    scraper_run_id, error_type, hardcover_id, hardcover_type,
                    error_message, stack_trace
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """,
                (
                    self.current_run_id,
                    error_type,
                    hardcover_id,
                    hardcover_type,
                    error_message,
                    stack_trace,
                ),
            )
            self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log error to database: {e}")
            self.conn.rollback()

    def get_or_create_author(
        self,
        hardcover_id: int,
        name: str,
        bio: Optional[str] = None,
        born_year: Optional[int] = None,
        death_year: Optional[int] = None,
    ) -> Optional[int]:
        """Get existing author or create new one, return author ID (BIGINT)"""
        try:
            # Check cache first
            if hardcover_id in self._author_cache:
                return self._author_cache[hardcover_id]

            # Start savepoint for author operation
            self.cursor.execute("SAVEPOINT author_operation")

            try:
                # Check if we've already imported this Hardcover author using external_id
                self.cursor.execute(
                    """
                    SELECT id FROM authors
                    WHERE external_source = 'hardcover' AND external_id = %s
                """,
                    (str(hardcover_id),),
                )
                result = self.cursor.fetchone()

                if result:
                    author_id = result["id"]
                    self._author_cache[hardcover_id] = author_id
                    # Release savepoint on success
                    self.cursor.execute("RELEASE SAVEPOINT author_operation")
                    return author_id

                # Create new author
                self.cursor.execute(
                    """
                    INSERT INTO authors (
                        name, bio, birth_year, death_year,
                        external_source, external_id,
                        created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, 'hardcover', %s, NOW(), NOW())
                    RETURNING id
                """,
                    (name, bio, born_year, death_year, str(hardcover_id)),
                )

                author_id = self.cursor.fetchone()["id"]
                self._author_cache[hardcover_id] = author_id

                # Release savepoint on success
                self.cursor.execute("RELEASE SAVEPOINT author_operation")
                logger.info(f"Created author: {name} (Hardcover ID: {hardcover_id})")
                return author_id

            except Exception as e:
                # Rollback to savepoint on error
                self.cursor.execute("ROLLBACK TO SAVEPOINT author_operation")
                logger.error(f"Failed to get/create author {name}: {e}")
                return None

        except Exception as e:
            # Error creating savepoint itself
            logger.error(f"Failed to create savepoint for author {name}: {e}")
            return None

    def get_or_create_genre(self, name: str) -> Optional[int]:
        """Get existing genre or create new one, return genre ID (BIGINT)"""
        try:
            # Validate input
            if not name or not isinstance(name, str):
                logger.error("Invalid genre name provided")
                return None

            # Normalize name for cache lookup
            name_lower = name.lower()

            # Check cache first
            if name_lower in self._genre_cache:
                return self._genre_cache[name_lower]

            # Start savepoint for genre operation
            self.cursor.execute("SAVEPOINT genre_operation")

            try:
                # Check if genre exists (case-insensitive)
                self.cursor.execute(
                    """
                    SELECT id FROM genres WHERE LOWER(name) = LOWER(%s)
                """,
                    (name,),
                )
                result = self.cursor.fetchone()

                if result:
                    genre_id = result["id"]
                    self._genre_cache[name_lower] = genre_id
                    # Release savepoint on success
                    self.cursor.execute("RELEASE SAVEPOINT genre_operation")
                    return genre_id

                # Create new genre
                self.cursor.execute(
                    """
                    INSERT INTO genres (name, created_at)
                    VALUES (%s, NOW())
                    RETURNING id
                """,
                    (name,),
                )

                genre_id = self.cursor.fetchone()["id"]
                self._genre_cache[name_lower] = genre_id

                # Release savepoint on success
                self.cursor.execute("RELEASE SAVEPOINT genre_operation")
                logger.info(f"Created genre: {name}")
                return genre_id

            except Exception as e:
                # Rollback to savepoint on error
                self.cursor.execute("ROLLBACK TO SAVEPOINT genre_operation")
                logger.error(f"Failed to get/create genre {name}: {e}")
                return None

        except Exception as e:
            # Error creating savepoint itself
            logger.error(f"Failed to create savepoint for genre {name}: {e}")
            return None

    def genre_exists(self, name: str) -> bool:
        """Check if a genre exists in the database"""
        try:
            # Validate input
            if not name or not isinstance(name, str):
                return False

            # Check cache first
            name_lower = name.lower()
            if name_lower in self._genre_cache:
                return True

            # Start savepoint for read operation
            self.cursor.execute("SAVEPOINT genre_exists_check")

            try:
                self.cursor.execute(
                    """
                    SELECT id FROM genres WHERE LOWER(name) = LOWER(%s)
                """,
                    (name,),
                )
                result = self.cursor.fetchone()

                # Release savepoint
                self.cursor.execute("RELEASE SAVEPOINT genre_exists_check")

                if result:
                    # Update cache if found
                    self._genre_cache[name_lower] = result["id"]
                    return True
                return False

            except Exception as e:
                # Rollback to savepoint on error
                self.cursor.execute("ROLLBACK TO SAVEPOINT genre_exists_check")
                logger.error(f"Failed to check genre existence {name}: {e}")
                return False

        except Exception as e:
            # Error creating savepoint itself
            logger.error(f"Failed to create savepoint for genre check {name}: {e}")
            return False

    def book_exists(self, hardcover_edition_id: int) -> bool:
        """Check if we've already imported this edition using external_id"""
        try:
            # Start savepoint for read operation
            self.cursor.execute("SAVEPOINT book_exists_check")

            try:
                self.cursor.execute(
                    """
                    SELECT 1 FROM books
                    WHERE external_source = 'hardcover' AND external_id = %s
                """,
                    (str(hardcover_edition_id),),
                )
                result = self.cursor.fetchone()

                # Release savepoint
                self.cursor.execute("RELEASE SAVEPOINT book_exists_check")
                return result is not None

            except Exception as e:
                # Rollback to savepoint on error
                self.cursor.execute("ROLLBACK TO SAVEPOINT book_exists_check")
                logger.error(f"Failed to check book existence {hardcover_edition_id}: {e}")
                return False

        except Exception as e:
            # Error creating savepoint itself
            logger.error(
                f"Failed to create savepoint for book check {hardcover_edition_id}: {e}"
            )
            return False

    def _validate_isbn(
        self, isbn: Optional[str], expected_length: int
    ) -> Optional[str]:
        """Validate and return ISBN if valid, None otherwise"""
        if not isbn or not isinstance(isbn, str):
            return None
        isbn = isbn.strip()
        if len(isbn) == expected_length and isbn.isdigit():
            return isbn
        return None

    def _check_duplicate_isbn(
        self, isbn_10: Optional[str], isbn_13: Optional[str]
    ) -> Optional[str]:
        """Check for duplicate ISBNs in database. Returns error message if duplicate found."""
        if isbn_10:
            self.cursor.execute("SELECT id FROM books WHERE isbn_10 = %s", (isbn_10,))
            if self.cursor.fetchone():
                return f"Duplicate ISBN-10: {isbn_10}"

        if isbn_13:
            self.cursor.execute("SELECT id FROM books WHERE isbn_13 = %s", (isbn_13,))
            if self.cursor.fetchone():
                return f"Duplicate ISBN-13: {isbn_13}"

        return None

    def _validate_language(self, edition_data: Dict) -> Tuple[bool, str]:
        """Validate language is English. Returns (is_valid, language_code or error_message)"""
        language = "en"
        language_obj = edition_data.get("language")
        if language_obj and isinstance(language_obj, dict):
            lang_name = language_obj.get("language") or ""
            lang_name = lang_name.lower() if isinstance(lang_name, str) else ""
            if lang_name and lang_name not in SUPPORTED_LANGUAGES:
                return False, f"Non-English language: {lang_name}"
        return True, language

    def _process_book_authors(self, edition_data: Dict, book_id: int) -> int:
        """Process and link authors to book. Returns count of authors imported."""
        authors_imported = 0
        author_order = 1

        contributions = edition_data.get("contributions", [])
        for contribution in contributions:
            if not contribution or not isinstance(contribution, dict):
                continue
            author_data = contribution.get("author")
            if not author_data or not isinstance(author_data, dict):
                continue

            # Skip authors without a bio
            if not author_data.get("bio"):
                logger.debug(f"Skipping author {author_data.get('name')} - no bio")
                continue

            author_id = self.get_or_create_author(
                author_data["id"],
                author_data["name"],
                author_data.get("bio"),
                author_data.get("born_year"),
                author_data.get("death_year"),
            )

            if author_id:
                # Link author to book with savepoint
                try:
                    self.cursor.execute("SAVEPOINT link_book_author")
                    self.cursor.execute(
                        """
                        INSERT INTO book_authors (book_id, author_id, author_order, created_at)
                        VALUES (%s, %s, %s, NOW())
                        ON CONFLICT (book_id, author_id) DO NOTHING
                    """,
                        (book_id, author_id, author_order),
                    )
                    self.cursor.execute("RELEASE SAVEPOINT link_book_author")
                    authors_imported += 1
                    author_order += 1
                except Exception as e:
                    self.cursor.execute("ROLLBACK TO SAVEPOINT link_book_author")
                    logger.error(
                        f"Failed to link author {author_id} to book {book_id}: {e}"
                    )

        return authors_imported

    def _process_book_genres(self, genres: List[str], book_id: int) -> None:
        """Process and link genres to book"""
        for genre_name in genres:
            if not genre_name:
                continue

            genre_id = self.get_or_create_genre(genre_name)
            if genre_id:
                # Link genre to book with savepoint
                try:
                    self.cursor.execute("SAVEPOINT link_book_genre")
                    self.cursor.execute(
                        """
                        INSERT INTO book_genres (book_id, genre_id, created_at)
                        VALUES (%s, %s, NOW())
                        ON CONFLICT (book_id, genre_id) DO NOTHING
                    """,
                        (book_id, genre_id),
                    )
                    self.cursor.execute("RELEASE SAVEPOINT link_book_genre")
                except Exception as e:
                    self.cursor.execute("ROLLBACK TO SAVEPOINT link_book_genre")
                    logger.error(f"Failed to link genre {genre_id} to book {book_id}: {e}")

    def import_edition(
        self, edition_data: Dict, book_id: int, book_description: str, genres: List[str],
        ebook_page_count: Optional[int] = None, audio_length_seconds: Optional[int] = None
    ) -> Tuple[bool, str, int]:
        """Import an edition as a book in our database, returns (success, message, authors_imported)"""
        try:
            # Start a savepoint for this import
            self.cursor.execute("SAVEPOINT edition_import")

            # Validate title
            title = edition_data.get("title") or ""
            title = title.strip() if isinstance(title, str) else ""
            if not title:
                return False, "Missing title", 0

            # Validate and normalize ISBNs
            isbn_10 = self._validate_isbn(edition_data.get("isbn_10"), ISBN_10_LENGTH)
            isbn_13 = self._validate_isbn(edition_data.get("isbn_13"), ISBN_13_LENGTH)

            if not isbn_10 and not isbn_13:
                return False, "Missing or invalid ISBNs", 0

            # Check for duplicate ISBNs
            duplicate_error = self._check_duplicate_isbn(isbn_10, isbn_13)
            if duplicate_error:
                return False, duplicate_error, 0

            # Validate language
            is_valid_language, language_or_error = self._validate_language(edition_data)
            if not is_valid_language:
                return False, language_or_error, 0
            language = language_or_error

            # Extract other fields
            subtitle = edition_data.get("subtitle") or ""
            subtitle = subtitle.strip() if isinstance(subtitle, str) else ""
            subtitle = subtitle or None  # Convert empty string to None

            description = book_description or ""
            description = description.strip() if isinstance(description, str) else ""
            description = description or None  # Convert empty string to None
            pages = edition_data.get("pages")
            pages = pages if pages and pages > 0 else None
            release_date = edition_data.get("release_date")

            # Safely extract publisher name
            publisher_obj = edition_data.get("publisher")
            publisher_name = None
            if publisher_obj and isinstance(publisher_obj, dict):
                publisher_name = publisher_obj.get("name")

            # Insert book
            self.cursor.execute(
                """
                INSERT INTO books (
                    title, subtitle, isbn_10, isbn_13, publisher,
                    published_date, page_count, ebook_page_count, audio_length_seconds,
                    language, description,
                    external_source, external_id,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'hardcover', %s, NOW(), NOW())
                RETURNING id
            """,
                (
                    title,
                    subtitle,
                    isbn_10,
                    isbn_13,
                    publisher_name,
                    release_date,
                    pages,
                    ebook_page_count,
                    audio_length_seconds,
                    language,
                    description,
                    str(edition_data["id"]),
                ),
            )

            book_internal_id = self.cursor.fetchone()["id"]

            # Process authors and genres
            authors_imported = self._process_book_authors(
                edition_data, book_internal_id
            )
            self._process_book_genres(genres, book_internal_id)

            # Release savepoint
            self.cursor.execute("RELEASE SAVEPOINT edition_import")
            self.conn.commit()

            logger.info(
                f"Imported edition: {title} (Hardcover ID: {edition_data['id']})"
            )
            return True, f"Successfully imported: {title}", authors_imported

        except Exception as e:
            self.cursor.execute("ROLLBACK TO SAVEPOINT edition_import")
            self.conn.rollback()
            error_msg = f"Error importing edition {edition_data.get('id')}: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, 0


class HardcoverScraper:
    """
    Main scraper orchestrator that coordinates book imports from Hardcover API.

    This class manages the scraping lifecycle: fetching books in batches,
    processing editions with their authors and genres, tracking progress,
    and handling graceful shutdowns. Supports resuming from incomplete runs.
    """

    def __init__(self):
        if not API_TOKEN:
            raise ValueError("HARDCOVER_API_TOKEN not set in environment")

        self.rate_limiter = RateLimiter(REQUESTS_PER_MINUTE)
        self.api = HardcoverAPI(API_TOKEN, self.rate_limiter)
        self.db = DatabaseManager(DB_CONFIG)
        self.running = True
        self.books_per_batch = BOOKS_PER_BATCH
        self.target_books_limit = TARGET_BOOKS_LIMIT

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False

    def _extract_genres_from_tags(self, cached_tags: Dict) -> List[str]:
        """Extract genre names from cached_tags, prioritizing popular tags"""
        genres = []

        if not cached_tags or "Genre" not in cached_tags:
            return genres

        genre_tags = cached_tags.get("Genre", [])
        if not isinstance(genre_tags, list):
            return genres

        # First pass: Get genres with count >= MIN_GENRE_TAG_COUNT
        for tag_obj in genre_tags:
            if not tag_obj or not isinstance(tag_obj, dict):
                continue
            genre_name = tag_obj.get("tag")
            count = tag_obj.get("count", 0)
            if genre_name and count >= MIN_GENRE_TAG_COUNT:
                genres.append(genre_name)

        # If no genres meet threshold, find first genre that exists in our DB
        if not genres:
            for tag_obj in genre_tags:
                if not tag_obj or not isinstance(tag_obj, dict):
                    continue
                genre_name = tag_obj.get("tag")
                if genre_name and self.db.genre_exists(genre_name):
                    genres.append(genre_name)
                    break  # Only need one fallback genre

        return genres

    def _is_ignorable_error(self, error_message: str) -> bool:
        """Check if error message is ignorable (duplicates, already exists, etc.)"""
        if not error_message or not isinstance(error_message, str):
            return False
        ignorable_keywords = ["duplicate", "already exists", "already imported"]
        return any(keyword in error_message.lower() for keyword in ignorable_keywords)

    def _process_book(self, book: Dict) -> Tuple[bool, int, Optional[str]]:
        """
        Process a single book and its edition.
        Returns (success, authors_imported, error_message)
        """
        book_id = book.get("id")
        if not book_id:
            logger.warning("Book missing ID")
            return False, 0, "Missing book ID"

        # Check if book has a physical edition
        edition_data = book.get("default_physical_edition")
        if not edition_data or not isinstance(edition_data, dict):
            logger.warning(f"Book {book_id} has no valid physical edition to import")
            return False, 0, "No physical edition"

        edition_id = edition_data.get("id")
        if not edition_id:
            logger.warning(f"Book {book_id} edition missing ID")
            return False, 0, "Missing edition ID"

        # Check if already imported
        if self.db.book_exists(edition_id):
            logger.debug(f"Edition {edition_id} already imported, skipping")
            return False, 0, "Already imported"

        # Extract genres and description
        genres = self._extract_genres_from_tags(book.get("cached_tags", {}))
        book_description = book.get("description", "")

        # Extract ebook page count
        ebook_page_count = None
        ebook_edition = book.get("default_ebook_edition")
        if ebook_edition and isinstance(ebook_edition, dict):
            ebook_pages = ebook_edition.get("pages")
            if ebook_pages and ebook_pages > 0:
                ebook_page_count = ebook_pages

        # Extract audiobook length in seconds
        audio_length_seconds = None
        audio_edition = book.get("default_audio_edition")
        if audio_edition and isinstance(audio_edition, dict):
            audio_seconds = audio_edition.get("audio_seconds")
            if audio_seconds and audio_seconds > 0:
                audio_length_seconds = audio_seconds

        # Import the edition
        success, message, authors_imported = self.db.import_edition(
            edition_data, book_id, book_description, genres,
            ebook_page_count, audio_length_seconds
        )

        return success, authors_imported, None if success else message

    def run(self):
        """Main scraper loop"""
        logger.info(
            f"Starting Hardcover scraper (target: {self.target_books_limit} books)..."
        )

        try:
            self.db.connect()

            # Check for incomplete run to resume
            incomplete_run = self.db.get_last_incomplete_run()
            resume_run_id = None
            offset = 0

            if incomplete_run and isinstance(incomplete_run, dict):
                resume_run_id = incomplete_run.get("id")
                offset = incomplete_run.get("last_offset", 0) or 0
                last_book_id = incomplete_run.get("last_hardcover_book_id")
                logger.info(
                    f"Found incomplete run {resume_run_id}. Resuming from offset {offset}, last book ID: {last_book_id}"
                )
            else:
                logger.info("No incomplete run found. Starting fresh.")

            self.db.start_scraper_run(resume_run_id=resume_run_id)

            total_books_processed = 0
            total_editions_imported = 0
            total_authors_imported = 0
            total_errors = 0
            last_book_id = None

            while self.running:
                logger.info(f"Fetching books batch (offset: {offset})...")

                # Apply rate limiting before API call
                self.rate_limiter.wait()

                # Get batch of popular books WITH edition details (single query!)
                books = self.api.get_popular_books_with_editions(
                    limit=self.books_per_batch, offset=offset
                )

                if not books:
                    logger.info("No more books to process, starting over...")
                    offset = 0
                    time.sleep(RETRY_DELAY_SECONDS)
                    continue

                # Track batch-level counts (for incremental stats update)
                batch_editions_imported = 0
                batch_authors_imported = 0
                batch_errors = 0

                for book in books:
                    if not self.running:
                        break

                    # Skip invalid book entries
                    if not book or not isinstance(book, dict):
                        continue

                    try:
                        book_id = book.get("id")
                        if not book_id:
                            logger.warning("Book missing ID, skipping")
                            continue

                        last_book_id = book_id
                        total_books_processed += 1

                        # Process the book
                        success, authors_imported, error_message = self._process_book(
                            book
                        )

                        if success:
                            batch_editions_imported += 1
                            batch_authors_imported += authors_imported
                            total_editions_imported += 1
                            total_authors_imported += authors_imported
                            logger.info(
                                f"Progress: {total_editions_imported} editions imported"
                            )
                        elif error_message and not self._is_ignorable_error(
                            error_message
                        ):
                            # Log non-ignorable errors
                            batch_errors += 1
                            total_errors += 1
                            # Safely extract edition ID
                            edition_obj = book.get("default_physical_edition")
                            edition_id = None
                            if edition_obj and isinstance(edition_obj, dict):
                                edition_id = edition_obj.get("id")
                            self.db.log_error(
                                "import_error", edition_id, "edition", error_message
                            )

                    except Exception as e:
                        batch_errors += 1
                        total_errors += 1
                        logger.error(f"Error processing book {book.get('id')}: {e}")
                        self.db.log_error(
                            "processing_error", book.get("id"), "book", str(e)
                        )

                # Update offset for next batch
                offset += self.books_per_batch

                # Update run statistics with last processed book ID and offset (use batch counts, not totals!)
                self.db.update_run_stats(
                    books_processed=len(books),
                    editions_imported=batch_editions_imported,
                    authors_imported=batch_authors_imported,
                    errors_count=batch_errors,
                    last_hardcover_book_id=last_book_id,
                    last_offset=offset,
                )
                logger.info(
                    f"Batch complete. Total: {total_editions_imported} editions imported, {total_errors} errors"
                )

                # Check if we've reached the target limit
                if total_editions_imported >= self.target_books_limit:
                    logger.info(
                        f"Target of {self.target_books_limit} books reached! Finishing scraper run."
                    )
                    self.db.end_scraper_run(
                        "completed",
                        f"Successfully imported {total_books_processed} books",
                    )
                    return

                # Small delay between batches
                time.sleep(BATCH_DELAY_SECONDS)

            # Graceful shutdown
            self.db.end_scraper_run("stopped", "Gracefully stopped by signal")

        except Exception as e:
            logger.error(f"Fatal error in scraper: {e}", exc_info=True)
            self.db.log_error(
                "fatal_error", None, "scraper", str(e), str(e.__traceback__)
            )
            self.db.end_scraper_run("failed", f"Fatal error: {str(e)}")
            raise

        finally:
            self.db.disconnect()
            logger.info("Scraper stopped")


def main():
    """Entry point"""
    try:
        scraper = HardcoverScraper()
        scraper.run()
    except Exception as e:
        logger.error(f"Scraper failed to start: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
