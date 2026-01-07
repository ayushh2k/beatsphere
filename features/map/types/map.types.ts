/**
 * Type definitions for map feature.
 */

export interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  currentlyPlaying?: any;
  username?: string;
  city?: string | null;
  listeningStatus?: 'live' | 'recent';
}

export type SheetMode = 'list' | 'detail';
