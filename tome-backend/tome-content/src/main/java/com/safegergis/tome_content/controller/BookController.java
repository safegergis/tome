package com.safegergis.tome_content.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.safegergis.tome_content.dto.BookDTO;
import com.safegergis.tome_content.dto.CreateBookRequest;
import com.safegergis.tome_content.service.BookService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for Book operations
 */
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    /**
     * GET /api/books/{id} - Get book by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<BookDTO> getBookById(@PathVariable Long id) {
        BookDTO book = bookService.getBookById(id);
        return ResponseEntity.ok(book);
    }

    /**
     * GET /api/books/isbn10/{isbn10} - Get book by ISBN-10
     */
    @GetMapping("/isbn10/{isbn10}")
    public ResponseEntity<BookDTO> getBookByIsbn10(@PathVariable String isbn10) {
        BookDTO book = bookService.getBookByIsbn10(isbn10);
        return ResponseEntity.ok(book);
    }

    /**
     * GET /api/books/isbn13/{isbn13} - Get book by ISBN-13
     */
    @GetMapping("/isbn13/{isbn13}")
    public ResponseEntity<BookDTO> getBookByIsbn13(@PathVariable String isbn13) {
        BookDTO book = bookService.getBookByIsbn13(isbn13);
        return ResponseEntity.ok(book);
    }

    /**
     * GET /api/books/search?q={query} - Search books by title or author name
     */
    @GetMapping("/search")
    public ResponseEntity<List<BookDTO>> searchBooks(@RequestParam String q) {
        List<BookDTO> books = bookService.searchBooks(q);
        return ResponseEntity.ok(books);
    }

    /**
     * GET /api/books/by-author/{authorId} - Get books by author
     */
    @GetMapping("/by-author/{authorId}")
    public ResponseEntity<List<BookDTO>> getBooksByAuthor(@PathVariable Long authorId) {
        List<BookDTO> books = bookService.getBooksByAuthorId(authorId);
        return ResponseEntity.ok(books);
    }

    /**
     * GET /api/books/by-genre/{genreId} - Get books by genre
     */
    @GetMapping("/by-genre/{genreId}")
    public ResponseEntity<List<BookDTO>> getBooksByGenre(@PathVariable Long genreId) {
        List<BookDTO> books = bookService.getBooksByGenreId(genreId);
        return ResponseEntity.ok(books);
    }

    /**
     * GET /api/books/by-publisher?publisher={publisher} - Get books by publisher
     */
    @GetMapping("/by-publisher")
    public ResponseEntity<List<BookDTO>> getBooksByPublisher(@RequestParam String publisher) {
        List<BookDTO> books = bookService.getBooksByPublisher(publisher);
        return ResponseEntity.ok(books);
    }

    /**
     * GET /api/books/by-language/{language} - Get books by language
     */
    @GetMapping("/by-language/{language}")
    public ResponseEntity<List<BookDTO>> getBooksByLanguage(@PathVariable String language) {
        List<BookDTO> books = bookService.getBooksByLanguage(language);
        return ResponseEntity.ok(books);
    }

    /**
     * POST /api/books - Create a new book
     */
    @PostMapping
    public ResponseEntity<BookDTO> createBook(@RequestBody CreateBookRequest request) {
        BookDTO createdBook = bookService.createBook(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBook);
    }

    /**
     * PUT /api/books/{id} - Update an existing book
     */
    @PutMapping("/{id}")
    public ResponseEntity<BookDTO> updateBook(
            @PathVariable Long id,
            @RequestBody CreateBookRequest request) {
        BookDTO updatedBook = bookService.updateBook(id, request);
        return ResponseEntity.ok(updatedBook);
    }

    /**
     * DELETE /api/books/{id} - Delete a book
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/books/{bookId}/authors/{authorId} - Add author to book
     */
    @PostMapping("/{bookId}/authors/{authorId}")
    public ResponseEntity<BookDTO> addAuthorToBook(
            @PathVariable Long bookId,
            @PathVariable Long authorId) {
        BookDTO book = bookService.addAuthorToBook(bookId, authorId);
        return ResponseEntity.ok(book);
    }

    /**
     * DELETE /api/books/{bookId}/authors/{authorId} - Remove author from book
     */
    @DeleteMapping("/{bookId}/authors/{authorId}")
    public ResponseEntity<BookDTO> removeAuthorFromBook(
            @PathVariable Long bookId,
            @PathVariable Long authorId) {
        BookDTO book = bookService.removeAuthorFromBook(bookId, authorId);
        return ResponseEntity.ok(book);
    }

    /**
     * POST /api/books/{bookId}/genres/{genreId} - Add genre to book
     */
    @PostMapping("/{bookId}/genres/{genreId}")
    public ResponseEntity<BookDTO> addGenreToBook(
            @PathVariable Long bookId,
            @PathVariable Long genreId) {
        BookDTO book = bookService.addGenreToBook(bookId, genreId);
        return ResponseEntity.ok(book);
    }

    /**
     * DELETE /api/books/{bookId}/genres/{genreId} - Remove genre from book
     */
    @DeleteMapping("/{bookId}/genres/{genreId}")
    public ResponseEntity<BookDTO> removeGenreFromBook(
            @PathVariable Long bookId,
            @PathVariable Long genreId) {
        BookDTO book = bookService.removeGenreFromBook(bookId, genreId);
        return ResponseEntity.ok(book);
    }
}
