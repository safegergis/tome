/**
 * Shelf type definitions and configurations
 */

export type ShelfType =
  | 'want-to-read'
  | 'currently-reading'
  | 'read'
  | 'did-not-finish';

export interface ShelfConfig {
  type: ShelfType;
  title: string;
  description: string;
  icon: string; // Ionicons name
  emptyMessage: string;
}

export const SHELF_CONFIGS: Record<ShelfType, ShelfConfig> = {
  'want-to-read': {
    type: 'want-to-read',
    title: 'Want to Read',
    description: 'Books you plan to read',
    icon: 'bookmark-outline',
    emptyMessage: 'No books in your want to read list',
  },
  'currently-reading': {
    type: 'currently-reading',
    title: 'Currently Reading',
    description: 'Books you are reading now',
    icon: 'book-outline',
    emptyMessage: 'No books currently being read',
  },
  'read': {
    type: 'read',
    title: 'Read',
    description: 'Books you have finished',
    icon: 'checkmark-circle-outline',
    emptyMessage: 'No completed books yet',
  },
  'did-not-finish': {
    type: 'did-not-finish',
    title: 'Did Not Finish',
    description: 'Books you decided not to complete',
    icon: 'close-circle-outline',
    emptyMessage: 'No DNF books',
  },
};
