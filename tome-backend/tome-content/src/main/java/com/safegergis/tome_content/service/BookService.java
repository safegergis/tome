package com.safegergis.tome_content.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_content.dto.BookDTO;
import com.safegergis.tome_content.dto.CreateBookRequest;
import com.safegergis.tome_content.exception.DuplicateResourceException;
import com.safegergis.tome_content.exception.ResourceNotFoundException;
import com.safegergis.tome_content.mapper.BookMapper;
import com.safegergis.tome_content.modal.Author;
import com.safegergis.tome_content.modal.Book;
import com.safegergis.tome_content.modal.Genre;
import com.safegergis.tome_content.repository.AuthorRepository;
import com.safegergis.tome_content.repository.BookRepository;
import com.safegergis.tome_content.repository.GenreRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service layer for Book operations
 */
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final GenreRepository genreRepository;

    /**
     * Get a book by ID
     */
    @Transactional(readOnly = true)
    public BookDTO getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", id));
        return BookMapper.toDTO(book);
    }

    /**
     * Get a book by ISBN-10
     */
    @Transactional(readOnly = true)
    public BookDTO getBookByIsbn10(String isbn10) {
        Book book = bookRepository.findByIsbn10(isbn10)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "ISBN-10: " + isbn10));
        return BookMapper.toDTO(book);
    }

    /**
     * Get a book by ISBN-13
     */
    @Transactional(readOnly = true)
    public BookDTO getBookByIsbn13(String isbn13) {
        Book book = bookRepository.findByIsbn13(isbn13)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "ISBN-13: " + isbn13));
        return BookMapper.toDTO(book);
    }

    /**
     * Search books by title
     */
    @Transactional(readOnly = true)
    public List<BookDTO> searchBooksByTitle(String title) {
        return bookRepository.searchByTitle(title).stream()
                .map(BookMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Search books by title or author name
     *
     * @param query the search query to match against book title or author name
     * @return list of book DTOs matching the search criteria
     */
    @Transactional(readOnly = true)
    public List<BookDTO> searchBooks(String query) {
        return bookRepository.searchByTitleOrAuthor(query).stream()
                .map(BookMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get books by author ID
     */
    @Transactional(readOnly = true)
    public List<BookDTO> getBooksByAuthorId(Long authorId) {
        return bookRepository.findByAuthorId(authorId).stream()
                .map(BookMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get books by genre ID
     */
    @Transactional(readOnly = true)
    public List<BookDTO> getBooksByGenreId(Long genreId) {
        return bookRepository.findByGenreId(genreId).stream()
                .map(BookMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get books by publisher
     */
    @Transactional(readOnly = true)
    public List<BookDTO> getBooksByPublisher(String publisher) {
        return bookRepository.findByPublisher(publisher).stream()
                .map(BookMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get books by language
     */
    @Transactional(readOnly = true)
    public List<BookDTO> getBooksByLanguage(String language) {
        return bookRepository.findByLanguage(language).stream()
                .map(BookMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new book
     */
    @Transactional
    public BookDTO createBook(CreateBookRequest request) {
        // Check if book already exists by ISBN
        if (request.getIsbn10() != null || request.getIsbn13() != null) {
            if (bookRepository.existsByIsbn10OrIsbn13(request.getIsbn10(), request.getIsbn13())) {
                throw new DuplicateResourceException("Book",
                        "ISBN-10: " + request.getIsbn10() + " or ISBN-13: " + request.getIsbn13());
            }
        }

        // Build the book entity
        Book book = Book.builder()
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .isbn10(request.getIsbn10())
                .isbn13(request.getIsbn13())
                .publisher(request.getPublisher())
                .publishedDate(request.getPublishedDate())
                .pageCount(request.getPageCount())
                .language(request.getLanguage() != null ? request.getLanguage() : "en")
                .description(request.getDescription())
                .coverUrl(request.getCoverUrl())
                .externalId(request.getExternalId())
                .externalSource(request.getExternalSource())
                .build();

        // Add authors if provided
        if (request.getAuthorIds() != null && !request.getAuthorIds().isEmpty()) {
            Set<Author> authors = new HashSet<>();
            for (Long authorId : request.getAuthorIds()) {
                Author author = authorRepository.findById(authorId)
                        .orElseThrow(() -> new ResourceNotFoundException("Author", authorId));
                authors.add(author);
            }
            book.setAuthors(authors);
        }

        // Add genres if provided
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            Set<Genre> genres = new HashSet<>();
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                        .orElseThrow(() -> new ResourceNotFoundException("Genre", genreId));
                genres.add(genre);
            }
            book.setGenres(genres);
        }

        Book savedBook = bookRepository.save(book);
        return BookMapper.toDTO(savedBook);
    }

    /**
     * Update an existing book
     */
    @Transactional
    public BookDTO updateBook(Long id, CreateBookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", id));

        // Update basic fields
        book.setTitle(request.getTitle());
        book.setSubtitle(request.getSubtitle());
        book.setIsbn10(request.getIsbn10());
        book.setIsbn13(request.getIsbn13());
        book.setPublisher(request.getPublisher());
        book.setPublishedDate(request.getPublishedDate());
        book.setPageCount(request.getPageCount());
        book.setLanguage(request.getLanguage() != null ? request.getLanguage() : "en");
        book.setDescription(request.getDescription());
        book.setCoverUrl(request.getCoverUrl());
        book.setExternalId(request.getExternalId());
        book.setExternalSource(request.getExternalSource());

        // Update authors if provided
        if (request.getAuthorIds() != null) {
            Set<Author> authors = new HashSet<>();
            for (Long authorId : request.getAuthorIds()) {
                Author author = authorRepository.findById(authorId)
                        .orElseThrow(() -> new ResourceNotFoundException("Author", authorId));
                authors.add(author);
            }
            book.setAuthors(authors);
        }

        // Update genres if provided
        if (request.getGenreIds() != null) {
            Set<Genre> genres = new HashSet<>();
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                        .orElseThrow(() -> new ResourceNotFoundException("Genre", genreId));
                genres.add(genre);
            }
            book.setGenres(genres);
        }

        Book updatedBook = bookRepository.save(book);
        return BookMapper.toDTO(updatedBook);
    }

    /**
     * Delete a book by ID
     */
    @Transactional
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new ResourceNotFoundException("Book", id);
        }
        bookRepository.deleteById(id);
    }

    /**
     * Find or create book by external ID
     */
    @Transactional
    public BookDTO findOrCreateByExternalId(String externalId, String externalSource, CreateBookRequest request) {
        return bookRepository.findByExternalIdAndExternalSource(externalId, externalSource)
                .map(BookMapper::toDTO)
                .orElseGet(() -> createBook(request));
    }

    /**
     * Add author to book
     */
    @Transactional
    public BookDTO addAuthorToBook(Long bookId, Long authorId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
        Author author = authorRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author", authorId));

        book.getAuthors().add(author);
        Book savedBook = bookRepository.save(book);
        return BookMapper.toDTO(savedBook);
    }

    /**
     * Remove author from book
     */
    @Transactional
    public BookDTO removeAuthorFromBook(Long bookId, Long authorId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
        Author author = authorRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author", authorId));

        book.getAuthors().remove(author);
        Book savedBook = bookRepository.save(book);
        return BookMapper.toDTO(savedBook);
    }

    /**
     * Add genre to book
     */
    @Transactional
    public BookDTO addGenreToBook(Long bookId, Long genreId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
        Genre genre = genreRepository.findById(genreId)
                .orElseThrow(() -> new ResourceNotFoundException("Genre", genreId));

        book.getGenres().add(genre);
        Book savedBook = bookRepository.save(book);
        return BookMapper.toDTO(savedBook);
    }

    /**
     * Remove genre from book
     */
    @Transactional
    public BookDTO removeGenreFromBook(Long bookId, Long genreId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
        Genre genre = genreRepository.findById(genreId)
                .orElseThrow(() -> new ResourceNotFoundException("Genre", genreId));

        book.getGenres().remove(genre);
        Book savedBook = bookRepository.save(book);
        return BookMapper.toDTO(savedBook);
    }
}
