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

import com.safegergis.tome_content.dto.AuthorDTO;
import com.safegergis.tome_content.dto.CreateAuthorRequest;
import com.safegergis.tome_content.service.AuthorService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for Author operations
 */
@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {

    private final AuthorService authorService;

    /**
     * GET /api/authors - Get all authors
     */
    @GetMapping
    public ResponseEntity<List<AuthorDTO>> getAllAuthors() {
        List<AuthorDTO> authors = authorService.getAllAuthors();
        return ResponseEntity.ok(authors);
    }

    /**
     * GET /api/authors/{id} - Get author by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuthorDTO> getAuthorById(@PathVariable Long id) {
        AuthorDTO author = authorService.getAuthorById(id);
        return ResponseEntity.ok(author);
    }

    /**
     * GET /api/authors/search?name={name} - Search authors by name
     */
    @GetMapping("/search")
    public ResponseEntity<List<AuthorDTO>> searchAuthors(@RequestParam String name) {
        List<AuthorDTO> authors = authorService.searchAuthorsByName(name);
        return ResponseEntity.ok(authors);
    }

    /**
     * GET /api/authors/by-book/{bookId} - Get authors for a specific book
     */
    @GetMapping("/by-book/{bookId}")
    public ResponseEntity<List<AuthorDTO>> getAuthorsByBook(@PathVariable Long bookId) {
        List<AuthorDTO> authors = authorService.getAuthorsByBookId(bookId);
        return ResponseEntity.ok(authors);
    }

    /**
     * GET /api/authors/by-source/{source} - Get authors by external source
     */
    @GetMapping("/by-source/{source}")
    public ResponseEntity<List<AuthorDTO>> getAuthorsBySource(@PathVariable String source) {
        List<AuthorDTO> authors = authorService.getAuthorsByExternalSource(source);
        return ResponseEntity.ok(authors);
    }

    /**
     * POST /api/authors - Create a new author
     */
    @PostMapping
    public ResponseEntity<AuthorDTO> createAuthor(@RequestBody CreateAuthorRequest request) {
        AuthorDTO createdAuthor = authorService.createAuthor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAuthor);
    }

    /**
     * PUT /api/authors/{id} - Update an existing author
     */
    @PutMapping("/{id}")
    public ResponseEntity<AuthorDTO> updateAuthor(
            @PathVariable Long id,
            @RequestBody CreateAuthorRequest request) {
        AuthorDTO updatedAuthor = authorService.updateAuthor(id, request);
        return ResponseEntity.ok(updatedAuthor);
    }

    /**
     * DELETE /api/authors/{id} - Delete an author
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAuthor(@PathVariable Long id) {
        authorService.deleteAuthor(id);
        return ResponseEntity.noContent().build();
    }
}
