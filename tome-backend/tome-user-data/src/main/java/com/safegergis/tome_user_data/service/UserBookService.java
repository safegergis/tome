package com.safegergis.tome_user_data.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.dto.CreateUserBookRequest;
import com.safegergis.tome_user_data.dto.UpdateUserBookRequest;
import com.safegergis.tome_user_data.dto.UserBookDTO;
import com.safegergis.tome_user_data.enums.ReadingStatus;
import com.safegergis.tome_user_data.exception.DuplicateResourceException;
import com.safegergis.tome_user_data.exception.ForbiddenException;
import com.safegergis.tome_user_data.exception.ResourceNotFoundException;
import com.safegergis.tome_user_data.mapper.UserBookMapper;
import com.safegergis.tome_user_data.model.UserBook;
import com.safegergis.tome_user_data.repository.UserBookRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service layer for UserBook operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserBookService {

    private final UserBookRepository userBookRepository;
    private final BookServiceClient bookServiceClient;

    /**
     * Add a book to user's shelf
     */
    @Transactional
    public UserBookDTO addBookToShelf(Long userId, CreateUserBookRequest request) {
        log.debug("Adding book {} to shelf for user {}", request.getBookId(), userId);

        // Check if book exists in tome-content
        BookSummaryDTO book = bookServiceClient.getBook(request.getBookId());

        // Check for duplicate
        if (userBookRepository.existsByUserIdAndBookId(userId, request.getBookId())) {
            throw new DuplicateResourceException("UserBook",
                    "user " + userId + " and book " + request.getBookId());
        }

        // Create user book
        UserBook userBook = UserBook.builder()
                .userId(userId)
                .bookId(request.getBookId())
                .status(request.getStatus())
                .currentPage(request.getCurrentPage() != null ? request.getCurrentPage() : 0)
                .currentSeconds(request.getCurrentSeconds() != null ? request.getCurrentSeconds() : 0)
                .userPageCount(request.getUserPageCount())
                .userAudioLengthSeconds(request.getUserAudioLengthSeconds())
                .personalRating(request.getPersonalRating())
                .notes(request.getNotes())
                .build();

        // Set timestamps based on status
        if (request.getStatus() == ReadingStatus.CURRENTLY_READING) {
            userBook.setStartedAt(OffsetDateTime.now());
        } else if (request.getStatus() == ReadingStatus.READ) {
            userBook.setFinishedAt(OffsetDateTime.now());
        }

        UserBook saved = userBookRepository.save(userBook);
        return UserBookMapper.toDTO(saved, book);
    }

    /**
     * Get a specific user book
     */
    @Transactional(readOnly = true)
    public UserBookDTO getUserBook(Long userId, Long userBookId) {
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new ResourceNotFoundException("UserBook", userBookId));

        // Check ownership
        if (!userBook.getUserId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this resource");
        }

        BookSummaryDTO book = bookServiceClient.getBook(userBook.getBookId());
        return UserBookMapper.toDTO(userBook, book);
    }

    /**
     * Get all books for a user, optionally filtered by status
     * This is the key method requested by the user
     */
    @Transactional(readOnly = true)
    public List<UserBookDTO> getUserBooksByStatus(Long userId, ReadingStatus status) {
        log.debug("Fetching books for user {} with status {}", userId, status);

        List<UserBook> userBooks;

        if (status == null) {
            // Get all books
            userBooks = userBookRepository.findByUserId(userId);
        } else {
            // Filter by status - convert enum to string for native query
            userBooks = userBookRepository.findByUserIdAndStatus(userId, status.name());
        }

        // Enrich with book details and map to DTO
        return userBooks.stream()
                .map(userBook -> {
                    BookSummaryDTO book = bookServiceClient.getBook(userBook.getBookId());
                    return UserBookMapper.toDTO(userBook, book);
                })
                .collect(Collectors.toList());
    }

    /**
     * Update a user book
     */
    @Transactional
    public UserBookDTO updateUserBook(Long userId, Long userBookId, UpdateUserBookRequest request) {
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new ResourceNotFoundException("UserBook", userBookId));

        // Check ownership
        if (!userBook.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        // Update fields if provided
        if (request.getStatus() != null) {
            updateStatus(userBook, request.getStatus());
        }
        if (request.getCurrentPage() != null) {
            userBook.setCurrentPage(request.getCurrentPage());
        }
        if (request.getCurrentSeconds() != null) {
            userBook.setCurrentSeconds(request.getCurrentSeconds());
        }
        if (request.getUserPageCount() != null) {
            userBook.setUserPageCount(request.getUserPageCount());
        }
        if (request.getUserAudioLengthSeconds() != null) {
            userBook.setUserAudioLengthSeconds(request.getUserAudioLengthSeconds());
        }
        if (request.getPersonalRating() != null) {
            userBook.setPersonalRating(request.getPersonalRating());
        }
        if (request.getNotes() != null) {
            userBook.setNotes(request.getNotes());
        }

        UserBook updated = userBookRepository.save(userBook);
        BookSummaryDTO book = bookServiceClient.getBook(updated.getBookId());
        return UserBookMapper.toDTO(updated, book);
    }

    /**
     * Update reading status with appropriate timestamp handling
     */
    @Transactional
    public UserBookDTO updateReadingStatus(Long userId, Long userBookId, ReadingStatus newStatus) {
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new ResourceNotFoundException("UserBook", userBookId));

        // Check ownership
        if (!userBook.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        updateStatus(userBook, newStatus);

        UserBook updated = userBookRepository.save(userBook);
        BookSummaryDTO book = bookServiceClient.getBook(updated.getBookId());
        return UserBookMapper.toDTO(updated, book);
    }

    /**
     * Helper method to update status and set appropriate timestamps
     */
    private void updateStatus(UserBook userBook, ReadingStatus newStatus) {
        ReadingStatus oldStatus = userBook.getStatus();
        userBook.setStatus(newStatus);

        // Set started_at when moving to currently-reading
        if (newStatus == ReadingStatus.CURRENTLY_READING && userBook.getStartedAt() == null) {
            userBook.setStartedAt(OffsetDateTime.now());
        }

        // Set finished_at when moving to read
        if (newStatus == ReadingStatus.READ && oldStatus != ReadingStatus.READ) {
            userBook.setFinishedAt(OffsetDateTime.now());
        }

        // Set dnf_date when marking as did-not-finish
        if (newStatus == ReadingStatus.DID_NOT_FINISH && oldStatus != ReadingStatus.DID_NOT_FINISH) {
            userBook.setDnfDate(OffsetDateTime.now());
        }
    }

    /**
     * Mark a book as Did Not Finish
     */
    @Transactional
    public UserBookDTO markAsDidNotFinish(Long userId, Long userBookId, String reason) {
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new ResourceNotFoundException("UserBook", userBookId));

        // Check ownership
        if (!userBook.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        userBook.setStatus(ReadingStatus.DID_NOT_FINISH);
        userBook.setDnfDate(OffsetDateTime.now());
        userBook.setDnfReason(reason);

        UserBook updated = userBookRepository.save(userBook);
        BookSummaryDTO book = bookServiceClient.getBook(updated.getBookId());
        return UserBookMapper.toDTO(updated, book);
    }

    /**
     * Remove a book from user's shelf
     */
    @Transactional
    public void removeBookFromShelf(Long userId, Long userBookId) {
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new ResourceNotFoundException("UserBook", userBookId));

        // Check ownership
        if (!userBook.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        userBookRepository.delete(userBook);
    }
}
