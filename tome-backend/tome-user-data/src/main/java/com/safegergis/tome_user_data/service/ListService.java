package com.safegergis.tome_user_data.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.dto.CreateListRequest;
import com.safegergis.tome_user_data.dto.ListDTO;
import com.safegergis.tome_user_data.enums.ListType;
import com.safegergis.tome_user_data.exception.DuplicateResourceException;
import com.safegergis.tome_user_data.exception.ForbiddenException;
import com.safegergis.tome_user_data.exception.ResourceNotFoundException;
import com.safegergis.tome_user_data.mapper.ListMapper;
import com.safegergis.tome_user_data.model.BookList;
import com.safegergis.tome_user_data.model.ListBook;
import com.safegergis.tome_user_data.model.ListBookId;
import com.safegergis.tome_user_data.repository.BookListRepository;
import com.safegergis.tome_user_data.repository.ListBookRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service layer for List operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ListService {

    private final BookListRepository listRepository;
    private final ListBookRepository listBookRepository;
    private final BookServiceClient bookServiceClient;
    private final UserServiceClient userServiceClient;

    /**
     * Create a new custom list
     */
    @Transactional
    public ListDTO createList(Long userId, CreateListRequest request) {
        log.debug("Creating list '{}' for user {}", request.getName(), userId);

        BookList list = BookList.builder()
                .userId(userId)
                .name(request.getName())
                .description(request.getDescription())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .isDefault(false)
                .listType(ListType.CUSTOM)
                .build();

        BookList saved = listRepository.save(list);
        String username = userServiceClient.getUser(userId).getUsername();
        return ListMapper.toDTOWithoutBooks(saved, 0, username);
    }

    /**
     * Get all lists for a user
     */
    @Transactional(readOnly = true)
    public List<ListDTO> getUserLists(Long userId) {
        List<BookList> lists = listRepository.findByUserIdAndDeletedAtIsNull(userId);

        // Fetch username once for the user
        String username = userServiceClient.getUser(userId).getUsername();

        return lists.stream()
                .map(list -> {
                    int bookCount = (int) listBookRepository.countByListId(list.getId());
                    return ListMapper.toDTOWithoutBooks(list, bookCount, username);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get public lists for a user (or all lists if viewing own)
     * Used when viewing another user's profile
     *
     * @param requestingUserId the user making the request
     * @param targetUserId the user whose lists to retrieve
     */
    @Transactional(readOnly = true)
    public List<ListDTO> getPublicUserLists(Long requestingUserId, Long targetUserId) {
        log.debug("User {} requesting lists for user {}", requestingUserId, targetUserId);

        List<BookList> lists = listRepository.findByUserIdAndDeletedAtIsNull(targetUserId);

        // Fetch username for the target user
        String username = userServiceClient.getUser(targetUserId).getUsername();

        // If viewing own lists, return all
        boolean isOwnProfile = requestingUserId.equals(targetUserId);

        return lists.stream()
                .filter(list -> isOwnProfile || list.getIsPublic()) // Filter public only for others
                .map(list -> {
                    int bookCount = (int) listBookRepository.countByListId(list.getId());
                    return ListMapper.toDTOWithoutBooks(list, bookCount, username);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get a specific list with books
     */
    @Transactional(readOnly = true)
    public ListDTO getList(Long userId, Long listId, boolean includeBooks) {
        BookList list = listRepository.findByIdAndDeletedAtIsNull(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", listId));

        // Check visibility (user's list or public list)
        if (!list.getUserId().equals(userId) && !list.getIsPublic()) {
            throw new ForbiddenException("Cannot access private list");
        }

        // Fetch username for the list owner
        String username = userServiceClient.getUser(list.getUserId()).getUsername();

        int bookCount = (int) listBookRepository.countByListId(listId);

        if (includeBooks) {
            List<BookSummaryDTO> books = getBooksInList(listId);
            return ListMapper.toDTO(list, books, bookCount, username);
        } else {
            return ListMapper.toDTOWithoutBooks(list, bookCount, username);
        }
    }

    /**
     * Get books in a list
     */
    private List<BookSummaryDTO> getBooksInList(Long listId) {
        List<ListBook> listBooks = listBookRepository.findByListIdOrderByBookOrder(listId);

        return listBooks.stream()
                .map(lb -> bookServiceClient.getBook(lb.getId().getBookId()))
                .collect(Collectors.toList());
    }

    /**
     * Update a list
     */
    @Transactional
    public ListDTO updateList(Long userId, Long listId, CreateListRequest request) {
        BookList list = listRepository.findByIdAndDeletedAtIsNull(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", listId));

        // Check ownership
        if (!list.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        // Can't modify default lists' metadata
        if (list.getIsDefault()) {
            throw new IllegalArgumentException("Cannot modify default lists");
        }

        list.setName(request.getName());
        list.setDescription(request.getDescription());
        if (request.getIsPublic() != null) {
            list.setIsPublic(request.getIsPublic());
        }

        BookList updated = listRepository.save(list);
        String username = userServiceClient.getUser(userId).getUsername();
        int bookCount = (int) listBookRepository.countByListId(listId);
        return ListMapper.toDTOWithoutBooks(updated, bookCount, username);
    }

    /**
     * Delete a list (soft delete)
     */
    @Transactional
    public void deleteList(Long userId, Long listId) {
        BookList list = listRepository.findByIdAndDeletedAtIsNull(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", listId));

        // Check ownership
        if (!list.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        // Can't delete default lists
        if (list.getIsDefault()) {
            throw new IllegalArgumentException("Cannot delete default lists");
        }

        list.setDeletedAt(OffsetDateTime.now());
        listRepository.save(list);
    }

    /**
     * Add a book to a list
     */
    @Transactional
    public void addBookToList(Long userId, Long listId, Long bookId) {
        BookList list = listRepository.findByIdAndDeletedAtIsNull(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", listId));

        // Check ownership
        if (!list.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        // Validate book exists
        bookServiceClient.getBook(bookId);

        // Check for duplicate
        if (listBookRepository.existsByIdListIdAndIdBookId(listId, bookId)) {
            throw new DuplicateResourceException("Book is already in this list");
        }

        // Get next order number
        Integer maxOrder = listBookRepository.findMaxBookOrderByListId(listId);
        int nextOrder = (maxOrder != null ? maxOrder : 0) + 1;

        // Create list book entry
        ListBook listBook = ListBook.builder()
                .id(new ListBookId(listId, bookId))
                .bookOrder(nextOrder)
                .build();

        listBookRepository.save(listBook);
        log.debug("Added book {} to list {} at position {}", bookId, listId, nextOrder);
    }

    /**
     * Remove a book from a list
     */
    @Transactional
    public void removeBookFromList(Long userId, Long listId, Long bookId) {
        BookList list = listRepository.findByIdAndDeletedAtIsNull(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", listId));

        // Check ownership
        if (!list.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        if (!listBookRepository.existsByIdListIdAndIdBookId(listId, bookId)) {
            throw new ResourceNotFoundException("Book not found in this list");
        }

        listBookRepository.deleteByListIdAndBookId(listId, bookId);
        log.debug("Removed book {} from list {}", bookId, listId);
    }

    /**
     * Reorder books in a list
     */
    @Transactional
    public void reorderBooksInList(Long userId, Long listId, List<Long> bookIds) {
        BookList list = listRepository.findByIdAndDeletedAtIsNull(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", listId));

        // Check ownership
        if (!list.getUserId().equals(userId)) {
            throw new ForbiddenException();
        }

        // Get current books in list
        List<ListBook> currentBooks = listBookRepository.findByListIdOrderByBookOrder(listId);

        // Validate all provided book IDs are in the list
        List<Long> currentBookIds = currentBooks.stream()
                .map(lb -> lb.getId().getBookId())
                .collect(Collectors.toList());

        for (Long bookId : bookIds) {
            if (!currentBookIds.contains(bookId)) {
                throw new IllegalArgumentException("Book " + bookId + " is not in this list");
            }
        }

        // Update order for each book
        for (int i = 0; i < bookIds.size(); i++) {
            Long bookId = bookIds.get(i);
            ListBook listBook = currentBooks.stream()
                    .filter(lb -> lb.getId().getBookId().equals(bookId))
                    .findFirst()
                    .orElseThrow();

            listBook.setBookOrder(i + 1);
            listBookRepository.save(listBook);
        }

        log.debug("Reordered books in list {}", listId);
    }

    /**
     * Get default list for a user by type
     * Creates it if it doesn't exist (fallback in case trigger didn't run)
     */
    @Transactional
    public ListDTO getDefaultList(Long userId, ListType listType) {
        if (listType == ListType.CUSTOM) {
            throw new IllegalArgumentException("CUSTOM is not a default list type");
        }

        // Fetch username for the user
        String username = userServiceClient.getUser(userId).getUsername();

        return listRepository.findByUserIdAndListTypeAndIsDefaultTrue(userId, listType.name())
                .map(list -> {
                    int bookCount = (int) listBookRepository.countByListId(list.getId());
                    return ListMapper.toDTOWithoutBooks(list, bookCount, username);
                })
                .orElseGet(() -> {
                    // Create default list if it doesn't exist
                    log.warn("Default list {} not found for user {}, creating it", listType, userId);
                    BookList newList = createDefaultList(userId, listType);
                    return ListMapper.toDTOWithoutBooks(newList, 0, username);
                });
    }

    /**
     * Create a default list
     */
    private BookList createDefaultList(Long userId, ListType listType) {
        String name = listType == ListType.CURRENTLY_READING ? "Currently Reading" : "To Be Read";
        String description = listType == ListType.CURRENTLY_READING
                ? "Books I am currently reading"
                : "Books I want to read";

        BookList list = BookList.builder()
                .userId(userId)
                .name(name)
                .description(description)
                .isPublic(true)
                .isDefault(true)
                .listType(listType)
                .build();

        return listRepository.save(list);
    }
}
