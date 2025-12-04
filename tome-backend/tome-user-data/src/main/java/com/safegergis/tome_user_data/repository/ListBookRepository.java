package com.safegergis.tome_user_data.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_user_data.model.ListBook;
import com.safegergis.tome_user_data.model.ListBookId;

@Repository
public interface ListBookRepository extends JpaRepository<ListBook, ListBookId> {

    /**
     * Find all books in a list, ordered by book_order
     */
    @Query("SELECT lb FROM ListBook lb WHERE lb.id.listId = :listId ORDER BY lb.bookOrder ASC")
    List<ListBook> findByListIdOrderByBookOrder(@Param("listId") Long listId);

    /**
     * Check if a book exists in a list
     */
    boolean existsByIdListIdAndIdBookId(Long listId, Long bookId);

    /**
     * Delete a book from a list
     */
    @Modifying
    @Query("DELETE FROM ListBook lb WHERE lb.id.listId = :listId AND lb.id.bookId = :bookId")
    void deleteByListIdAndBookId(@Param("listId") Long listId, @Param("bookId") Long bookId);

    /**
     * Count books in a list
     */
    @Query("SELECT COUNT(lb) FROM ListBook lb WHERE lb.id.listId = :listId")
    long countByListId(@Param("listId") Long listId);

    /**
     * Find the maximum book_order in a list
     */
    @Query("SELECT COALESCE(MAX(lb.bookOrder), 0) FROM ListBook lb WHERE lb.id.listId = :listId")
    Integer findMaxBookOrderByListId(@Param("listId") Long listId);

    /**
     * Delete all books from a list
     */
    @Modifying
    @Query("DELETE FROM ListBook lb WHERE lb.id.listId = :listId")
    void deleteAllByListId(@Param("listId") Long listId);
}
