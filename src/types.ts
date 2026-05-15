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
    offsetX?: number;
    offsetY?: number;
    rotate: number;
    zIndex: number;
    color?: 'secondary' | 'tertiary' | 'primary' | 'yellow';
    column?: 'left' | 'right' | 'full';
    design?: string;
    bgColor?: string;
    fontFamily?: 'sans' | 'serif' | 'mono';
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    align?: 'left' | 'center' | 'right';
    size?: 'sm' | 'md' | 'lg';
  };
}

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  bio: string;
  subtitle: string;
  avatarUrl: string;
  isPublic: boolean;
  backgroundColor?: string;
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'lines' | 'diagonal' | 'cross' | 'checkerboard';
  headerBackgroundColor?: string;
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k' | 'standard' | 'gothic' | 'medieval' | 'scrapbook';
  titleFontFamily?: 'sans' | 'serif' | 'mono';
  titleFontSize?: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontSize?: 'sm' | 'md' | 'lg';
  createdAt?: string;
}

export interface GuestbookEntry {
  id: string;
  authorId?: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  message: string;
  createdAt: any;
}
