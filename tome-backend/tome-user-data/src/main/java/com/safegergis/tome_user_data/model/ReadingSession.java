package com.safegergis.tome_user_data.model;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.safegergis.tome_user_data.enums.ReadingMethod;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reading_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "pages_read")
    private Integer pagesRead;

    @Column(name = "minutes_read")
    private Integer minutesRead;

    @Enumerated(EnumType.STRING)
    @Column(name = "reading_method", nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ReadingMethod readingMethod;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "start_page")
    private Integer startPage;

    @Column(name = "end_page")
    private Integer endPage;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

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
        if (sessionDate == null) {
            sessionDate = LocalDate.now();
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
