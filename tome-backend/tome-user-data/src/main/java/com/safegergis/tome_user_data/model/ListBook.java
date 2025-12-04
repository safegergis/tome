package com.safegergis.tome_user_data.model;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "list_books")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListBook {

    @EmbeddedId
    private ListBookId id;

    @Column(name = "book_order", nullable = false)
    private Integer bookOrder;

    @Column(name = "added_at", nullable = false, updatable = false)
    private OffsetDateTime addedAt;

    /**
     * Lifecycle callback: Called before entity is persisted to database
     * Sets addedAt timestamp if not already set
     */
    @PrePersist
    protected void onCreate() {
        if (addedAt == null) {
            addedAt = OffsetDateTime.now();
        }
    }
}
