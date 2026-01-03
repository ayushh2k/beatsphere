/**
 * Analytics service for tracking user behavior and app events.
 * Singleton service that manages analytics sessions and event tracking.
 */

import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Dimensions } from 'react-native';
import api from '@/utils/api';
import { STORAGE_KEYS } from '@/config/constants';
import type { AnalyticsSession } from './types';

class AnalyticsService {
  private sessionId: string | null = null;
  private deviceId: string | null = null;
  private username: string | null = null;
  private initialized: boolean = false;

  /**
   * Initialize analytics session.
   * Call this on app startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get or create deviceId
      this.deviceId = await this.getOrCreateDeviceId();

      // Get username if logged in
      this.username = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_USERNAME);

      // Collect platform metadata
      const { width, height } = Dimensions.get('window');
      const metadata = {
        os: Platform.OS,
        device_model: Device.modelName || Device.deviceName || 'Unknown',
        screen_width: width,
        screen_height: height,
        app_version: Constants.expoConfig?.version || '1.0.0',
      };

      const platform = {
        os: Platform.OS,
      };

      // Create session
      const response = await api.post('/analytics/session', {
        deviceId: this.deviceId,
        platform,
        metadata,
        username: this.username || undefined,
      });

      this.sessionId = response.data.id;
      if (this.sessionId) {
        await SecureStore.setItemAsync(STORAGE_KEYS.ANALYTICS_SESSION, this.sessionId);
      }

      this.initialized = true;
      console.log('Analytics initialized:', this.sessionId);
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Link user to current session after login.
   */
  async linkUser(username: string, userId?: number): Promise<void> {
    if (!this.sessionId) {
      console.warn('Cannot link user: No active session');
      return;
    }

    try {
      this.username = username;

      await api.patch(`/analytics/session/${this.sessionId}/user`, {
        username,
        userId,
      });

      console.log('User linked to analytics session:', username);
    } catch (error) {
      console.error('Failed to link user to analytics:', error);
    }
  }

  /**
   * Track an event.
   */
  async track(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.sessionId) {
      console.warn('Cannot track event: No active session');
      return;
    }

    try {
      const eventData = {
        sessionId: this.sessionId,
        eventName,
        properties: {
          ...(properties || {}),
          timestamp: new Date().toISOString(),
          username: this.username,
        },
      };

      await api.post('/analytics/track', eventData);

      if (__DEV__) {
        console.log('📊 Analytics:', eventName, properties || {});
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track screen view.
   */
  async trackScreenView(screenName: string, params?: Record<string, any>): Promise<void> {
    await this.track('screen_view', {
      screen_name: screenName,
      ...params,
    });
  }

  /**
   * Track login event.
   */
  async trackLogin(username: string): Promise<void> {
    await this.track('login', {
      username,
      login_method: 'lastfm',
    });
  }

  /**
   * Track logout event.
   */
  async trackLogout(): Promise<void> {
    await this.track('logout', {
      username: this.username,
    });
    this.username = null;
  }

  /**
   * Track map interaction.
   */
  async trackMapInteraction(action: string, data?: Record<string, any>): Promise<void> {
    await this.track('map_interaction', {
      action,
      ...data,
    });
  }

  /**
   * Track chat message.
   */
  async trackChatMessage(
    messageType: 'text' | 'gif',
    chatType: 'global' | 'direct'
  ): Promise<void> {
    await this.track('chat_message_sent', {
      message_type: messageType,
      chat_type: chatType,
    });
  }

  /**
   * Get or create a persistent device ID.
   */
  private async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await SecureStore.getItemAsync(STORAGE_KEYS.ANALYTICS_DEVICE);

    if (!deviceId) {
      // Generate UUID v4
      deviceId = this.generateUUID();
      await SecureStore.setItemAsync(STORAGE_KEYS.ANALYTICS_DEVICE, deviceId);
    }

    return deviceId;
  }

  /**
   * Generate a UUID v4.
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get current session ID.
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get current username.
   */
  getUsername(): string | null {
    return this.username;
  }
}

// Export singleton instance
const analytics = new AnalyticsService();
export default analytics;
