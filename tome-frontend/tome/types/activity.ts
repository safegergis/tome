import { ReadingSessionDTO } from './reading-session';

export enum ActivityType {
  READING_SESSION = 'READING_SESSION',
  LIST_CREATED = 'LIST_CREATED',
  BOOK_FINISHED = 'BOOK_FINISHED',
}

export interface UserSummary {
  userId: number;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ListSummary {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  bookCount: number;
  createdAt: string;
}

export interface BookSummary {
  id: number;
  title: string;
  authorNames: string[];
  isbn10?: string;
  coverUrl?: string;
}

export interface UserBookSummary {
  id: number;
  bookId: number;
  book: BookSummary;
  status: 'WANT_TO_READ' | 'CURRENTLY_READING' | 'READ' | 'DID_NOT_FINISH';
  finishedAt: string;
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  userId: number;
  user: UserSummary;
  timestamp: string;
  readingSession?: ReadingSessionDTO;
  list?: ListSummary;
  userBook?: UserBookSummary;
}

export interface PaginatedActivityFeed {
  content: ActivityFeedItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
