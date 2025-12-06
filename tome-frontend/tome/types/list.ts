/**
 * List types matching the tome-user-data API
 */

/**
 * List type enum
 */
export enum ListType {
  WANT_TO_READ = 'WANT_TO_READ',
  CURRENTLY_READING = 'CURRENTLY_READING',
  READ = 'READ',
  DID_NOT_FINISH = 'DID_NOT_FINISH',
  CUSTOM = 'CUSTOM',
}

/**
 * Book summary for list display
 */
export interface BookSummaryDTO {
  id: number;
  title: string;
  authorNames: string[];
  coverUrl?: string;
  isbn10?: string;
  isbn13?: string;
}

/**
 * List DTO from backend
 */
export interface ListDTO {
  id: number;
  userId: number;
  username: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isDefault: boolean;
  listType: ListType;
  bookCount: number;
  books?: BookSummaryDTO[];  // Only included if includeBooks=true
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating a new list
 */
export interface CreateListRequest {
  name: string;
  description?: string;
  isPublic: boolean;
}

/**
 * Request payload for updating a list
 */
export interface UpdateListRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}
