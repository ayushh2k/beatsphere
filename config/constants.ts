/**
 * Centralized application constants.
 * All API URLs, storage keys, timeouts, and magic numbers should be defined here.
 */

import { env } from './env';

// API Endpoints
export const API_ENDPOINTS = {
  BACKEND: env.EXPO_PUBLIC_BACKEND_URL,
  WEBSOCKET: `wss://${env.EXPO_PUBLIC_BACKEND_URL.replace(/^https?:\/\//, '')}/chat`,
  LASTFM: 'https://ws.audioscrobbler.com/2.0/',
  MUSICBRAINZ: 'https://musicbrainz.org/ws/2',
  COVER_ART: 'https://coverartarchive.org',
  WIKIDATA: 'https://www.wikidata.org/wiki/Special:EntityData',
  ITUNES: 'https://itunes.apple.com/search',
} as const;

// Secure Storage Keys
export const STORAGE_KEYS = {
  LASTFM_SESSION: 'lastfm_session_key',
  LASTFM_USERNAME: 'lastfm_username',
  LASTFM_USER_IMAGE: 'lastfm_user_image',
  ANALYTICS_SESSION: 'analytics_session_id',
  ANALYTICS_DEVICE: 'analytics_device_id',
  CURRENTLY_PLAYING: 'currently_playing',
  REMAPPED_CACHE: 'remapped_2025_data',
} as const;

// Cache Durations (in milliseconds)
export const CACHE_DURATIONS = {
  REMAPPED_DATA: 24 * 60 * 60 * 1000, // 24 hours
  LISTENING_STATUS: 10 * 60 * 1000,   // 10 minutes
  TOP_TRACKS: 5 * 60 * 1000,          // 5 minutes
  TOP_ARTISTS: 5 * 60 * 1000,         // 5 minutes
  TOP_ALBUMS: 5 * 60 * 1000,          // 5 minutes
  USER_PROFILE: 10 * 60 * 1000,       // 10 minutes
} as const;

// API Timeouts (in milliseconds)
export const TIMEOUTS = {
  MUSICBRAINZ_API: 15000,
  COVER_ART_API: 10000,
  ITUNES_API: 10000,
  DEFAULT: 5000,
} as const;

// Rate Limiting Delays (in milliseconds)
export const RATE_LIMITS = {
  MUSICBRAINZ_DELAY: 1500,
  MUSICBRAINZ_SHORT_DELAY: 1200,
  LASTFM_DELAY: 1000,
} as const;

// Audio Settings
export const AUDIO_SETTINGS = {
  DEFAULT_VOLUME: 0.4,
  UNMUTED_VOLUME: 0.3,
} as const;

// MusicBrainz Configuration
export const MUSICBRAINZ_CONFIG = {
  USER_AGENT: 'BeatSphere/1.2.0',
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 2000,
} as const;

// Remapped (Year in Review) Configuration
export const REMAPPED_CONFIG = {
  DEFAULT_TRACK_DURATION_MS: 3.5 * 60 * 1000, // 3.5 minutes
  IGNORED_TAGS: new Set([
    'seen live', 'favorites', 'indie', 'pop', 'rock', 'alternative', 'electronic',
    'experimental', 'folk', 'punk', 'metal', 'jazz', 'hip hop', 'rap', 'soul',
    'rnb', 'r&b', 'classic rock', 'hard rock', 'alternative rock', 'indie rock',
    'indie pop', 'synth-pop', 'electropop', 'art pop', 'dream pop', 'noise pop',
    'Lo-Fi', 'chill', 'ambient', 'downtempo', 'trip-hop', 'post-rock',
    'post-punk', 'new wave', 'shoegaze'
  ]),
} as const;

// Listening Status
export const LISTENING_CONFIG = {
  RECENT_SCROBBLE_THRESHOLD: 600, // 10 minutes in seconds
} as const;
