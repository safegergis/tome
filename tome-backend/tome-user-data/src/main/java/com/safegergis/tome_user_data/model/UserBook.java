package com.safegergis.tome_user_data.model;

import java.time.OffsetDateTime;

import com.safegergis.tome_user_data.enums.ReadingStatus;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_books", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "book_id" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "reading_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ReadingStatus status;

    @Column(name = "current_page")
    @Builder.Default
    private Integer currentPage = 0;

    @Column(name = "current_seconds")
    @Builder.Default
    private Integer currentSeconds = 0;

    @Column(name = "user_page_count")
    private Integer userPageCount;

    @Column(name = "user_audio_length_seconds")
    private Integer userAudioLengthSeconds;

    @Column(name = "personal_rating")
    private Integer personalRating;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @Column(name = "dnf_date")
    private OffsetDateTime dnfDate;

    @Column(name = "dnf_reason", columnDefinition = "TEXT")
    private String dnfReason;

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
