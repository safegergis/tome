package com.safegergis.tome_user_data.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_user_data.dto.ActivityFeedDTO;
import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.dto.ListSummaryDTO;
import com.safegergis.tome_user_data.dto.ReadingSessionDTO;
import com.safegergis.tome_user_data.dto.UserBookSummaryDTO;
import com.safegergis.tome_user_data.dto.UserSummaryDTO;
import com.safegergis.tome_user_data.enums.ActivityType;
import com.safegergis.tome_user_data.mapper.ReadingSessionMapper;
import com.safegergis.tome_user_data.model.BookList;
import com.safegergis.tome_user_data.model.Friendship;
import com.safegergis.tome_user_data.model.ReadingSession;
import com.safegergis.tome_user_data.model.UserBook;
import com.safegergis.tome_user_data.repository.BookListRepository;
import com.safegergis.tome_user_data.repository.FriendshipRepository;
import com.safegergis.tome_user_data.repository.ListBookRepository;
import com.safegergis.tome_user_data.repository.ReadingSessionRepository;
import com.safegergis.tome_user_data.repository.UserBookRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for aggregating and providing activity feed data
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityFeedService {

    private final FriendshipRepository friendshipRepository;
    private final ReadingSessionRepository readingSessionRepository;
    private final BookListRepository bookListRepository;
    private final ListBookRepository listBookRepository;
    private final UserBookRepository userBookRepository;
    private final UserServiceClient userServiceClient;
    private final BookServiceClient bookServiceClient;

    /**
     * Get activity feed for a user's friends
     * Aggregates activities from multiple sources and returns them in reverse chronological order
     *
     * @param userId The user requesting the feed
     * @param pageable Pagination information
     * @return Paginated activity feed
     */
    @Transactional(readOnly = true)
    public Page<ActivityFeedDTO> getFriendActivityFeed(Long userId, Pageable pageable) {
        log.debug("Fetching activity feed for user {} (page {})", userId, pageable.getPageNumber());

        // 1. Get friend IDs
        List<Long> friendIds = getFriendIds(userId);

        if (friendIds.isEmpty()) {
            log.debug("User {} has no friends, returning empty feed", userId);
            return Page.empty(pageable);
        }

        log.debug("User {} has {} friends", userId, friendIds.size());

        // 2. Fetch reading sessions from friends (last 100)
        List<ReadingSession> sessions = readingSessionRepository.findRecentByUserIds(
            friendIds,
            PageRequest.of(0, 100)
        );

        log.debug("Found {} reading sessions from friends", sessions.size());

        // 3. Fetch public lists created by friends (last 100)
        List<BookList> lists = bookListRepository.findRecentPublicListsByUserIds(
            friendIds,
            PageRequest.of(0, 100)
        );

        log.debug("Found {} public lists from friends", lists.size());

        // 4. Fetch finished books from friends (last 100)
        List<UserBook> finishedBooks = userBookRepository.findRecentFinishedByUserIds(
            friendIds,
            PageRequest.of(0, 100)
        );

        log.debug("Found {} finished books from friends", finishedBooks.size());

        // 5. Collect all book IDs (from sessions and finished books)
        Set<Long> bookIds = new HashSet<>();
        bookIds.addAll(sessions.stream()
            .map(ReadingSession::getBookId)
            .collect(Collectors.toSet()));
        bookIds.addAll(finishedBooks.stream()
            .map(UserBook::getBookId)
            .collect(Collectors.toSet()));

        Map<Long, BookSummaryDTO> books = bookServiceClient.getBooks(bookIds);

        // 6. Convert reading sessions to activities
        List<ActivityFeedDTO> sessionActivities = sessions.stream()
            .map(session -> {
                ReadingSessionDTO sessionDTO = ReadingSessionMapper.toDTO(
                    session,
                    books.get(session.getBookId())
                );

                return ActivityFeedDTO.builder()
                    .id("session-" + session.getId())
                    .type(ActivityType.READING_SESSION)
                    .userId(session.getUserId())
                    .timestamp(session.getCreatedAt())
                    .readingSession(sessionDTO)
                    .build();
            })
            .collect(Collectors.toList());

        // 7. Convert lists to activities
        List<ActivityFeedDTO> listActivities = lists.stream()
            .map(list -> {
                ListSummaryDTO listSummary = ListSummaryDTO.builder()
                    .id(list.getId())
                    .name(list.getName())
                    .description(list.getDescription())
                    .isPublic(list.getIsPublic())
                    .bookCount(listBookRepository.countByListId(list.getId()))
                    .createdAt(list.getCreatedAt())
                    .build();

                return ActivityFeedDTO.builder()
                    .id("list-" + list.getId())
                    .type(ActivityType.LIST_CREATED)
                    .userId(list.getUserId())
                    .timestamp(list.getCreatedAt())
                    .list(listSummary)
                    .build();
            })
            .collect(Collectors.toList());

        // 8. Convert finished books to activities
        List<ActivityFeedDTO> finishedBookActivities = finishedBooks.stream()
            .map(userBook -> {
                UserBookSummaryDTO userBookSummary = UserBookSummaryDTO.builder()
                    .id(userBook.getId())
                    .bookId(userBook.getBookId())
                    .book(books.get(userBook.getBookId()))
                    .status(userBook.getStatus())
                    .finishedAt(userBook.getFinishedAt())
                    .build();

                return ActivityFeedDTO.builder()
                    .id("book-" + userBook.getId())
                    .type(ActivityType.BOOK_FINISHED)
                    .userId(userBook.getUserId())
                    .timestamp(userBook.getFinishedAt())
                    .userBook(userBookSummary)
                    .build();
            })
            .collect(Collectors.toList());

        // 9. Merge all activities and sort by timestamp
        List<ActivityFeedDTO> allActivities = new ArrayList<>();
        allActivities.addAll(sessionActivities);
        allActivities.addAll(listActivities);
        allActivities.addAll(finishedBookActivities);
        allActivities.sort(Comparator.comparing(ActivityFeedDTO::getTimestamp).reversed());

        // 10. Batch fetch user data for all unique userIds
        enrichWithUserData(allActivities);

        // 11. Apply pagination
        return paginateInMemory(allActivities, pageable);
    }

    /**
     * Get list of friend IDs for a user
     */
    private List<Long> getFriendIds(Long userId) {
        Page<Friendship> friendships = friendshipRepository.findAllFriendships(
            userId,
            Pageable.unpaged()
        );

        return friendships.getContent().stream()
            .map(friendship -> {
                // Get the other user's ID
                return friendship.getUserId().equals(userId)
                    ? friendship.getFriendId()
                    : friendship.getUserId();
            })
            .collect(Collectors.toList());
    }

    /**
     * Enrich activities with user data
     */
    private void enrichWithUserData(List<ActivityFeedDTO> activities) {
        if (activities.isEmpty()) {
            return;
        }

        // Get unique user IDs
        Set<Long> userIds = activities.stream()
            .map(ActivityFeedDTO::getUserId)
            .collect(Collectors.toSet());

        // Batch fetch user data
        Map<Long, UserSummaryDTO> users = userServiceClient.getUsers(userIds);

        // Enrich each activity
        activities.forEach(activity -> {
            activity.setUser(users.get(activity.getUserId()));
        });
    }

    /**
     * Apply pagination to in-memory list
     */
    private Page<ActivityFeedDTO> paginateInMemory(List<ActivityFeedDTO> allActivities, Pageable pageable) {
        int pageSize = pageable.getPageSize();
        int currentPage = pageable.getPageNumber();
        int startItem = currentPage * pageSize;

        if (startItem >= allActivities.size()) {
            return new PageImpl<>(List.of(), pageable, allActivities.size());
        }

        int endItem = Math.min(startItem + pageSize, allActivities.size());
        List<ActivityFeedDTO> pageContent = allActivities.subList(startItem, endItem);

        return new PageImpl<>(pageContent, pageable, allActivities.size());
    }
}
