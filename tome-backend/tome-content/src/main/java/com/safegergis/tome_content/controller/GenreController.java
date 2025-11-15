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

import com.safegergis.tome_content.dto.CreateGenreRequest;
import com.safegergis.tome_content.dto.GenreDTO;
import com.safegergis.tome_content.service.GenreService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for Genre operations
 */
@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreService genreService;

    /**
     * GET /api/genres - Get all genres
     */
    @GetMapping
    public ResponseEntity<List<GenreDTO>> getAllGenres() {
        List<GenreDTO> genres = genreService.getAllGenres();
        return ResponseEntity.ok(genres);
    }

    /**
     * GET /api/genres/{id} - Get genre by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<GenreDTO> getGenreById(@PathVariable Long id) {
        GenreDTO genre = genreService.getGenreById(id);
        return ResponseEntity.ok(genre);
    }

    /**
     * GET /api/genres/search?name={name} - Search genres by name
     */
    @GetMapping("/search")
    public ResponseEntity<List<GenreDTO>> searchGenres(@RequestParam String name) {
        List<GenreDTO> genres = genreService.searchGenresByName(name);
        return ResponseEntity.ok(genres);
    }

    /**
     * GET /api/genres/by-book/{bookId} - Get genres for a specific book
     */
    @GetMapping("/by-book/{bookId}")
    public ResponseEntity<List<GenreDTO>> getGenresByBook(@PathVariable Long bookId) {
        List<GenreDTO> genres = genreService.getGenresByBookId(bookId);
        return ResponseEntity.ok(genres);
    }

    /**
     * POST /api/genres - Create a new genre
     */
    @PostMapping
    public ResponseEntity<GenreDTO> createGenre(@RequestBody CreateGenreRequest request) {
        GenreDTO createdGenre = genreService.createGenre(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGenre);
    }

    /**
     * PUT /api/genres/{id} - Update an existing genre
     */
    @PutMapping("/{id}")
    public ResponseEntity<GenreDTO> updateGenre(
            @PathVariable Long id,
            @RequestBody CreateGenreRequest request) {
        GenreDTO updatedGenre = genreService.updateGenre(id, request);
        return ResponseEntity.ok(updatedGenre);
    }

    /**
     * DELETE /api/genres/{id} - Delete a genre
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGenre(@PathVariable Long id) {
        genreService.deleteGenre(id);
        return ResponseEntity.noContent().build();
    }
}
