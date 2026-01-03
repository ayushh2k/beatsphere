/**
 * Hook for real-time user location streaming via SSE.
 * Connects to backend SSE endpoint to receive live user location updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/config/constants';
import type { UserLocation } from '../types';

export function useUserStream() {
  const [otherUsers, setOtherUsers] = useState<UserLocation[]>([]);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const initializeStream = useCallback(async () => {
    const username = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_USERNAME);
    if (!username) {
      console.log('Location stream: No username found, cannot start');
      return;
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('GET', `${API_ENDPOINTS.BACKEND}/users/stream`);
    xhr.setRequestHeader('Accept', 'text/event-stream');

    let processedLength = 0;
    let buffer = '';

    xhr.onreadystatechange = () => {
      // readyState 3 (LOADING) means we have partial data, 4 (DONE) means stream closed/error
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        const response = xhr.responseText || '';
        const chunk = response.substring(processedLength);
        processedLength = response.length;

        if (chunk.length > 0) {
          buffer += chunk;

          // Split by double newline to get full events
          const parts = buffer.split('\n\n');

          // The last part might be incomplete, so we keep it in the buffer
          // and process the rest
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const jsonStr = line.substring(5).trim();
                if (jsonStr) {
                  try {
                    const locations: UserLocation[] = JSON.parse(jsonStr);

                    const validLocations = locations
                      .filter(
                        (loc) =>
                          loc &&
                          typeof loc.latitude === 'number' &&
                          typeof loc.longitude === 'number'
                      )
                      .map((loc) => ({
                        ...loc,
                        username: loc.username || loc.name || loc.id,
                      }));

                    const filtered = validLocations.filter((loc) => loc.id !== username);
                    setOtherUsers(filtered);
                  } catch (e) {
                    // Parse error - skip this chunk
                  }
                }
              }
            }
          }
        }
      }

      if (xhr.readyState === 4) {
        // Connection closed - could implement reconnect logic here if needed
      }
    };

    xhr.onerror = (e) => {
      console.error('Location stream: XHR Error', e);
    };

    xhr.send();

    return () => {
      xhr.abort();
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    initializeStream().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [initializeStream]);

  return {
    otherUsers,
  };
}
