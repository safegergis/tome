package com.safegergis.tome_user_data.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.dto.CreateReadingSessionRequest;
import com.safegergis.tome_user_data.dto.ReadingSessionDTO;
import com.safegergis.tome_user_data.dto.ReadingStatisticsDTO;
import com.safegergis.tome_user_data.enums.ReadingMethod;
import com.safegergis.tome_user_data.enums.ReadingStatus;
import com.safegergis.tome_user_data.exception.ForbiddenException;
import com.safegergis.tome_user_data.exception.ResourceNotFoundException;
import com.safegergis.tome_user_data.mapper.ReadingSessionMapper;
import com.safegergis.tome_user_data.model.ReadingSession;
import com.safegergis.tome_user_data.model.UserBook;
import com.safegergis.tome_user_data.repository.ReadingSessionRepository;
import com.safegergis.tome_user_data.repository.UserBookRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service layer for ReadingSession operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReadingSessionService {

    private final ReadingSessionRepository sessionRepository;
    private final UserBookRepository userBookRepository;
    private final BookServiceClient bookServiceClient;

    /**
     * Log a new reading session
     * Validates constraints and auto-updates UserBook progress
     */
    @Transactional
    public ReadingSessionDTO logSession(Long userId, CreateReadingSessionRequest request) {
        log.debug("Logging reading session for user {} and book {}", userId, request.getBookId());

        // Validate book exists
        BookSummaryDTO book = bookServiceClient.getBook(request.getBookId());

        // Validate reading method constraints
        validateSessionConstraints(request);

        // Create session
        ReadingSession session = ReadingSession.builder()
                .userId(userId)
                .bookId(request.getBookId())
                .pagesRead(request.getPagesRead())
                .minutesRead(request.getMinutesRead())
                .readingMethod(request.getReadingMethod())
                .sessionDate(request.getSessionDate() != null ? request.getSessionDate() : LocalDate.now())
                .startPage(request.getStartPage())
                .endPage(request.getEndPage())
                .notes(request.getNotes())
                .build();

        ReadingSession saved = sessionRepository.save(session);

        // Auto-update UserBook progress if it exists
        updateUserBookProgress(userId, request);

        return ReadingSessionMapper.toDTO(saved, book);
    }

    /**
     * Validate session constraints based on reading method
     */
    private void validateSessionConstraints(CreateReadingSessionRequest request) {
        if (request.getReadingMethod() == ReadingMethod.AUDIOBOOK) {
            if (request.getMinutesRead() == null || request.getMinutesRead() <= 0) {
                throw new IllegalArgumentException("Audiobook sessions require minutes_read to be specified");
            }
        } else {
            // Physical or ebook
            if (request.getPagesRead() == null || request.getPagesRead() <= 0) {
                throw new IllegalArgumentException("Physical/ebook sessions require pages_read to be specified");
            }
        }

        // Validate start/end page consistency
        if (request.getStartPage() != null && request.getEndPage() != null) {
            if (request.getEndPage() <= request.getStartPage()) {
                throw new IllegalArgumentException("end_page must be greater than start_page");
            }
        }
    }

    /**
     * Auto-update UserBook progress when a session is logged
     * Creates UserBook if it doesn't exist and automatically marks as CURRENTLY_READING
     */
    private void updateUserBookProgress(Long userId, CreateReadingSessionRequest request) {
        userBookRepository.findByUserIdAndBookId(userId, request.getBookId())
                .ifPresentOrElse(userBook -> {
                    // Automatically mark as currently reading if logging a session
                    if (userBook.getStatus() != ReadingStatus.CURRENTLY_READING) {
                        userBook.setStatus(ReadingStatus.CURRENTLY_READING);

                        // Set started_at if not already set
                        if (userBook.getStartedAt() == null) {
                            userBook.setStartedAt(java.time.OffsetDateTime.now());
                        }

                        log.debug("Updated status to CURRENTLY_READING for user {} and book {}", userId, request.getBookId());
                    }

                    // Update progress based on reading method
                    if (request.getReadingMethod() == ReadingMethod.AUDIOBOOK && request.getMinutesRead() != null) {
                        int currentSeconds = userBook.getCurrentSeconds() != null ? userBook.getCurrentSeconds() : 0;
                        int newSeconds = currentSeconds + (request.getMinutesRead() * 60);
                        userBook.setCurrentSeconds(newSeconds);
                    } else if (request.getPagesRead() != null) {
                        // Use end_page if provided, otherwise add pages_read to current
                        if (request.getEndPage() != null) {
                            userBook.setCurrentPage(request.getEndPage());
                        } else {
                            int currentPage = userBook.getCurrentPage() != null ? userBook.getCurrentPage() : 0;
                            userBook.setCurrentPage(currentPage + request.getPagesRead());
                        }
                    }

                    userBookRepository.save(userBook);
                    log.debug("Updated UserBook progress for user {} and book {}", userId, request.getBookId());
                }, () -> {
                    // UserBook doesn't exist - create it with CURRENTLY_READING status
                    UserBook newUserBook = UserBook.builder()
                            .userId(userId)
                            .bookId(request.getBookId())
                            .status(ReadingStatus.CURRENTLY_READING)
                            .currentPage(0)
                            .currentSeconds(0)
                            .startedAt(java.time.OffsetDateTime.now())
                            .build();

                    // Set initial progress based on reading method
                    if (request.getReadingMethod() == ReadingMethod.AUDIOBOOK && request.getMinutesRead() != null) {
                        newUserBook.setCurrentSeconds(request.getMinutesRead() * 60);
                    } else if (request.getPagesRead() != null) {
                        if (request.getEndPage() != null) {
                            newUserBook.setCurrentPage(request.getEndPage());
                        } else {
                            newUserBook.setCurrentPage(request.getPagesRead());
                        }
                    }

                    userBookRepository.save(newUserBook);
                    log.info("Created new UserBook with CURRENTLY_READING status for user {} and book {}", userId, request.getBookId());
                });
    }

    /**
     * Get a specific reading session
     */
    @Transactional(readOnly = true)
    public ReadingSessionDTO getSession(Long userId, Long sessionId) {
        ReadingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingSession", sessionId));

        // Check ownership
        if (!session.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        BookSummaryDTO book = bookServiceClient.getBook(session.getBookId());
        return ReadingSessionMapper.toDTO(session, book);
    }

    /**
     * Get recent sessions for a user
     */
    @Transactional(readOnly = true)
    public List<ReadingSessionDTO> getRecentSessions(Long userId, int limit) {
        List<ReadingSession> sessions = sessionRepository.findRecentByUserId(userId, PageRequest.of(0, limit));

        return sessions.stream()
                .map(session -> {
                    BookSummaryDTO book = bookServiceClient.getBook(session.getBookId());
                    return ReadingSessionMapper.toDTO(session, book);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get all sessions for a specific book
     */
    @Transactional(readOnly = true)
    public List<ReadingSessionDTO> getSessionsForBook(Long userId, Long bookId) {
        List<ReadingSession> sessions = sessionRepository.findByUserIdAndBookId(userId, bookId);

        BookSummaryDTO book = bookServiceClient.getBook(bookId);

        return sessions.stream()
                .map(session -> ReadingSessionMapper.toDTO(session, book))
                .collect(Collectors.toList());
    }

    /**
     * Get reading statistics for a user
     */
    @Transactional(readOnly = true)
    public ReadingStatisticsDTO getUserStatistics(Long userId) {
        LocalDate weekAgo = LocalDate.now().minusDays(7);
        LocalDate monthAgo = LocalDate.now().minusDays(30);

        // Get session counts
        long sessionsThisWeek = sessionRepository.countSessionsSince(userId, weekAgo);
        long sessionsThisMonth = sessionRepository.countSessionsSince(userId, monthAgo);

        // Get pages/minutes
        Long pagesThisWeek = sessionRepository.sumPagesReadSince(userId, weekAgo);
        Long minutesThisWeek = sessionRepository.sumMinutesReadSince(userId, weekAgo);
        Long pagesThisMonth = sessionRepository.sumPagesReadSince(userId, monthAgo);
        Long minutesThisMonth = sessionRepository.sumMinutesReadSince(userId, monthAgo);

        // Get book counts by status - convert enum to string for native query
        long currentlyReadingCount = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.CURRENTLY_READING.name());
        long readCount = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.READ.name());
        long wantToReadCount = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.WANT_TO_READ.name());
        long didNotFinishCount = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.DID_NOT_FINISH.name());

        // Calculate preferred reading method (most used in recent sessions)
        ReadingMethod preferredMethod = calculatePreferredMethod(userId);

        return ReadingStatisticsDTO.builder()
                .userId(userId)
                .sessionsThisWeek(sessionsThisWeek)
                .pagesThisWeek(pagesThisWeek != null ? pagesThisWeek : 0L)
                .minutesThisWeek(minutesThisWeek != null ? minutesThisWeek : 0L)
                .sessionsThisMonth(sessionsThisMonth)
                .pagesThisMonth(pagesThisMonth != null ? pagesThisMonth : 0L)
                .minutesThisMonth(minutesThisMonth != null ? minutesThisMonth : 0L)
                .currentlyReadingCount(currentlyReadingCount)
                .readCount(readCount)
                .wantToReadCount(wantToReadCount)
                .didNotFinishCount(didNotFinishCount)
                .preferredMethod(preferredMethod)
                .build();
    }

    /**
     * Calculate the user's preferred reading method based on recent sessions
     */
    private ReadingMethod calculatePreferredMethod(Long userId) {
        List<ReadingSession> recentSessions = sessionRepository.findRecentByUserId(userId, PageRequest.of(0, 20));

        if (recentSessions.isEmpty()) {
            return null;
        }

        // Count occurrences of each method
        long physicalCount = recentSessions.stream()
                .filter(s -> s.getReadingMethod() == ReadingMethod.PHYSICAL)
                .count();
        long ebookCount = recentSessions.stream()
                .filter(s -> s.getReadingMethod() == ReadingMethod.EBOOK)
                .count();
        long audiobookCount = recentSessions.stream()
                .filter(s -> s.getReadingMethod() == ReadingMethod.AUDIOBOOK)
                .count();

        // Return most common
        if (physicalCount >= ebookCount && physicalCount >= audiobookCount) {
            return ReadingMethod.PHYSICAL;
        } else if (ebookCount >= audiobookCount) {
            return ReadingMethod.EBOOK;
        } else {
            return ReadingMethod.AUDIOBOOK;
        }
    }

    /**
     * Delete a reading session
     */
    @Transactional
    public void deleteSession(Long userId, Long sessionId) {
        ReadingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingSession", sessionId));

        // Check ownership
        if (!session.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        sessionRepository.delete(session);
    }
}
