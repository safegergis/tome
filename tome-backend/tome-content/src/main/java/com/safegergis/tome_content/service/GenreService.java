package com.safegergis.tome_content.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_content.dto.CreateGenreRequest;
import com.safegergis.tome_content.dto.GenreDTO;
import com.safegergis.tome_content.exception.DuplicateResourceException;
import com.safegergis.tome_content.exception.ResourceNotFoundException;
import com.safegergis.tome_content.mapper.GenreMapper;
import com.safegergis.tome_content.modal.Genre;
import com.safegergis.tome_content.repository.GenreRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service layer for Genre operations
 */
@Service
@RequiredArgsConstructor
public class GenreService {

    private final GenreRepository genreRepository;

    /**
     * Get all genres
     */
    @Transactional(readOnly = true)
    public List<GenreDTO> getAllGenres() {
        return genreRepository.findAllByOrderByNameAsc().stream()
                .map(GenreMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a genre by ID
     */
    @Transactional(readOnly = true)
    public GenreDTO getGenreById(Long id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre", id));
        return GenreMapper.toDTO(genre);
    }

    /**
     * Get a genre by name (case-insensitive)
     */
    @Transactional(readOnly = true)
    public GenreDTO getGenreByName(String name) {
        Genre genre = genreRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new ResourceNotFoundException("Genre", name));
        return GenreMapper.toDTO(genre);
    }

    /**
     * Search genres by name pattern
     */
    @Transactional(readOnly = true)
    public List<GenreDTO> searchGenresByName(String namePattern) {
        return genreRepository.findByNameContainingIgnoreCase(namePattern).stream()
                .map(GenreMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new genre
     */
    @Transactional
    public GenreDTO createGenre(CreateGenreRequest request) {
        // Check if genre already exists
        if (genreRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Genre", request.getName());
        }

        Genre genre = Genre.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Genre savedGenre = genreRepository.save(genre);
        return GenreMapper.toDTO(savedGenre);
    }

    /**
     * Update an existing genre
     */
    @Transactional
    public GenreDTO updateGenre(Long id, CreateGenreRequest request) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre", id));

        // Check if new name conflicts with existing genre
        if (!genre.getName().equals(request.getName()) &&
                genreRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Genre", request.getName());
        }

        genre.setName(request.getName());
        genre.setDescription(request.getDescription());

        Genre updatedGenre = genreRepository.save(genre);
        return GenreMapper.toDTO(updatedGenre);
    }

    /**
     * Delete a genre by ID
     */
    @Transactional
    public void deleteGenre(Long id) {
        if (!genreRepository.existsById(id)) {
            throw new ResourceNotFoundException("Genre", id);
        }
        genreRepository.deleteById(id);
    }

    /**
     * Get genres for a specific book
     */
    @Transactional(readOnly = true)
    public List<GenreDTO> getGenresByBookId(Long bookId) {
        return genreRepository.findByBookId(bookId).stream()
                .map(GenreMapper::toDTO)
                .collect(Collectors.toList());
    }
}
