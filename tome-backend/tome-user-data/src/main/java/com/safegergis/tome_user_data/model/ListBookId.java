package com.safegergis.tome_user_data.model;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListBookId implements Serializable {

    @Column(name = "list_id")
    private Long listId;

    @Column(name = "book_id")
    private Long bookId;
}
