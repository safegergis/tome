package com.safegergis.tome_content.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_content.dto.AuthorDTO;
import com.safegergis.tome_content.dto.CreateAuthorRequest;
import com.safegergis.tome_content.exception.DuplicateResourceException;
import com.safegergis.tome_content.exception.ResourceNotFoundException;
import com.safegergis.tome_content.mapper.AuthorMapper;
import com.safegergis.tome_content.modal.Author;
import com.safegergis.tome_content.repository.AuthorRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service layer for Author operations
 */
@Service
@RequiredArgsConstructor
public class AuthorService {

    private final AuthorRepository authorRepository;

    /**
     * Get all authors
     */
    @Transactional(readOnly = true)
    public List<AuthorDTO> getAllAuthors() {
        return authorRepository.findAll().stream()
                .map(AuthorMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get an author by ID
     */
    @Transactional(readOnly = true)
    public AuthorDTO getAuthorById(Long id) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Author", id));
        return AuthorMapper.toDTO(author);
    }

    /**
     * Get an author by name
     */
    @Transactional(readOnly = true)
    public AuthorDTO getAuthorByName(String name) {
        Author author = authorRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Author", name));
        return AuthorMapper.toDTO(author);
    }

    /**
     * Search authors by name pattern
     */
    @Transactional(readOnly = true)
    public List<AuthorDTO> searchAuthorsByName(String namePattern) {
        return authorRepository.findByNameContainingIgnoreCase(namePattern).stream()
                .map(AuthorMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new author
     */
    @Transactional
    public AuthorDTO createAuthor(CreateAuthorRequest request) {
        // Check if author already exists by name
        if (authorRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Author", request.getName());
        }

        Author author = Author.builder()
                .name(request.getName())
                .bio(request.getBio())
                .birthYear(request.getBirthYear())
                .deathYear(request.getDeathYear())
                .photoUrl(request.getPhotoUrl())
                .externalId(request.getExternalId())
                .externalSource(request.getExternalSource())
                .build();

        Author savedAuthor = authorRepository.save(author);
        return AuthorMapper.toDTO(savedAuthor);
    }

    /**
     * Update an existing author
     */
    @Transactional
    public AuthorDTO updateAuthor(Long id, CreateAuthorRequest request) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Author", id));

        // Check if new name conflicts with existing author
        if (!author.getName().equals(request.getName()) &&
                authorRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Author", request.getName());
        }

        author.setName(request.getName());
        author.setBio(request.getBio());
        author.setBirthYear(request.getBirthYear());
        author.setDeathYear(request.getDeathYear());
        author.setPhotoUrl(request.getPhotoUrl());
        author.setExternalId(request.getExternalId());
        author.setExternalSource(request.getExternalSource());

        Author updatedAuthor = authorRepository.save(author);
        return AuthorMapper.toDTO(updatedAuthor);
    }

    /**
     * Delete an author by ID
     */
    @Transactional
    public void deleteAuthor(Long id) {
        if (!authorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Author", id);
        }
        authorRepository.deleteById(id);
    }

    /**
     * Get authors for a specific book
     */
    @Transactional(readOnly = true)
    public List<AuthorDTO> getAuthorsByBookId(Long bookId) {
        return authorRepository.findByBookId(bookId).stream()
                .map(AuthorMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get authors by external source
     */
    @Transactional(readOnly = true)
    public List<AuthorDTO> getAuthorsByExternalSource(String externalSource) {
        return authorRepository.findByExternalSource(externalSource).stream()
                .map(AuthorMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Find or create author by external ID
     */
    @Transactional
    public AuthorDTO findOrCreateByExternalId(String externalId, String externalSource, CreateAuthorRequest request) {
        return authorRepository.findByExternalIdAndExternalSource(externalId, externalSource)
                .map(AuthorMapper::toDTO)
                .orElseGet(() -> createAuthor(request));
    }
}
