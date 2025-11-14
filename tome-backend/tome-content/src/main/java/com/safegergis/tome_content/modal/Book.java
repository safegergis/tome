package com.safegergis.tome_content.modal;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "books")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 500)
    private String subtitle;

    @Column(name = "isbn_10", length = 10, unique = true)
    private String isbn10;

    @Column(name = "isbn_13", length = 13, unique = true)
    private String isbn13;

    @Column(length = 255)
    private String publisher;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(length = 10, nullable = false)
    private String language = "en";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    @Column(name = "external_id", length = 255)
    private String externalId;

    @Column(name = "external_source", length = 50)
    private String externalSource;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "book_authors", joinColumns = @JoinColumn(name = "book_id"), inverseJoinColumns = @JoinColumn(name = "author_id"))
    @Builder.Default
    private Set<Author> authors = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "book_genres", joinColumns = @JoinColumn(name = "book_id"), inverseJoinColumns = @JoinColumn(name = "genre_id"))
    @Builder.Default
    private Set<Genre> genres = new HashSet<>();

    /**
     * Lifecycle callback: Called before entity is persisted to database
     * Sets createdAt and updatedAt timestamps if not already set
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = OffsetDateTime.now();
        }
    }

    /**
     * Lifecycle callback: Called before entity is updated in database
     * Updates the updatedAt timestamp
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
