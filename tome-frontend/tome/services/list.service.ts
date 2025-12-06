/**
 * List API Service
 * Provides methods for managing book lists
 */

import { ENV } from '@/config/env';
import { apiClient } from './api-client';
import { ListDTO, CreateListRequest, UpdateListRequest, ListType } from '@/types/list';

const LISTS_API_URL = `${ENV.USER_DATA_API_URL}/lists`;

export const listApi = {
  /**
   * Get all lists for authenticated user
   */
  getUserLists: async (token: string): Promise<ListDTO[]> => {
    console.log('[listApi] Fetching user lists');

    const result = await apiClient.authenticatedFetch<ListDTO[]>(
      LISTS_API_URL,
      token
    );

    console.log('[listApi] Fetched', result.length, 'lists');
    return result;
  },

  /**
   * Get specific list with optional books
   */
  getList: async (
    listId: number,
    includeBooks: boolean,
    token: string
  ): Promise<ListDTO> => {
    console.log('[listApi] Fetching list', listId, 'includeBooks:', includeBooks);

    const result = await apiClient.authenticatedFetch<ListDTO>(
      `${LISTS_API_URL}/${listId}?includeBooks=${includeBooks}`,
      token
    );

    console.log('[listApi] Fetched list:', result.name, 'with', result.bookCount, 'books');
    return result;
  },

  /**
   * Get default list by type
   */
  getDefaultList: async (
    type: ListType,
    token: string
  ): Promise<ListDTO> => {
    // Convert enum to backend format (e.g., WANT_TO_READ -> want-to-read)
    const typeString = type.toLowerCase().replace(/_/g, '-');
    console.log('[listApi] Fetching default list type:', typeString);

    const result = await apiClient.authenticatedFetch<ListDTO>(
      `${LISTS_API_URL}/default/${typeString}`,
      token
    );

    console.log('[listApi] Fetched default list:', result.name);
    return result;
  },

  /**
   * Create a new custom list
   */
  createList: async (
    data: CreateListRequest,
    token: string
  ): Promise<ListDTO> => {
    console.log('[listApi] Creating list:', data.name);

    const result = await apiClient.authenticatedFetch<ListDTO>(
      LISTS_API_URL,
      token,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    console.log('[listApi] Created list:', result.id);
    return result;
  },

  /**
   * Update an existing list
   */
  updateList: async (
    listId: number,
    data: UpdateListRequest,
    token: string
  ): Promise<ListDTO> => {
    console.log('[listApi] Updating list:', listId);

    const result = await apiClient.authenticatedFetch<ListDTO>(
      `${LISTS_API_URL}/${listId}`,
      token,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    console.log('[listApi] Updated list:', result.id);
    return result;
  },

  /**
   * Delete a list
   */
  deleteList: async (
    listId: number,
    token: string
  ): Promise<void> => {
    console.log('[listApi] Deleting list:', listId);

    await apiClient.authenticatedFetch<void>(
      `${LISTS_API_URL}/${listId}`,
      token,
      {
        method: 'DELETE',
      }
    );

    console.log('[listApi] Deleted list:', listId);
  },

  /**
   * Add book to list
   */
  addBookToList: async (
    listId: number,
    bookId: number,
    token: string
  ): Promise<void> => {
    console.log('[listApi] Adding book', bookId, 'to list', listId);

    await apiClient.authenticatedFetch<void>(
      `${LISTS_API_URL}/${listId}/books/${bookId}`,
      token,
      {
        method: 'POST',
      }
    );

    console.log('[listApi] Added book to list');
  },

  /**
   * Remove book from list
   */
  removeBookFromList: async (
    listId: number,
    bookId: number,
    token: string
  ): Promise<void> => {
    console.log('[listApi] Removing book', bookId, 'from list', listId);

    await apiClient.authenticatedFetch<void>(
      `${LISTS_API_URL}/${listId}/books/${bookId}`,
      token,
      {
        method: 'DELETE',
      }
    );

    console.log('[listApi] Removed book from list');
  },

  /**
   * Reorder books in a list
   */
  reorderBooks: async (
    listId: number,
    bookIds: number[],
    token: string
  ): Promise<void> => {
    console.log('[listApi] Reordering books in list', listId, 'New order:', bookIds);

    await apiClient.authenticatedFetch<void>(
      `${LISTS_API_URL}/${listId}/books/order`,
      token,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookIds),
      }
    );

    console.log('[listApi] Books reordered successfully');
  },
};
