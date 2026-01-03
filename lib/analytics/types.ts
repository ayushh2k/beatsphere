/**
 * Analytics type definitions.
 */

export interface AnalyticsSession {
  id: string;
  deviceId: string;
  userId?: number;
  username?: string;
  platform: {
    os: string;
    browser?: string;
  };
  metadata: {
    os: string;
    browser?: string;
    device_model: string;
    screen_width: number;
    screen_height: number;
    app_version: string;
    ip?: string;
    location_country?: string;
  };
  startedAt: string;
  lastActiveAt: string;
}
