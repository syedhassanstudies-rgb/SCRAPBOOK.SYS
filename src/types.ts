/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScrapbookPieceData {
  id: string;
  type: 'music' | 'note' | 'polaroid' | 'decoration' | 'guestbook' | 'movie' | 'top-movies' | 'top-songs';
  data: any;
  style: {
    x: number;
    y: number;
    rotate: number;
    zIndex: number;
    color?: 'secondary' | 'tertiary' | 'primary' | 'yellow';
    column?: 'left' | 'right' | 'full';
    design?: string;
    bgColor?: string;
    fontFamily?: 'sans' | 'serif' | 'mono';
    borderStyle?: 'solid' | 'dashed' | 'dotted';
  };
}

export interface UserProfile {
  uid: string;
  username: string;
  bio: string;
  subtitle: string;
  avatarUrl: string;
  isPublic: boolean;
  backgroundColor?: string;
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'lines';
  headerBackgroundColor?: string;
}

export interface GuestbookEntry {
  id: string;
  authorId?: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  message: string;
  createdAt: any;
}
