/**
 * Authentication hook for Last.fm OAuth flow.
 * Manages login state, deep link handling, and session persistence.
 */

import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { getMobileSession, getUserInfo } from '@/lib/lastfm';
import analytics from '@/lib/analytics';
import { env } from '@/config/env';
import { STORAGE_KEYS } from '@/config/constants';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null means "checking"
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    const checkInitialLogin = async () => {
      const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);
      if (sessionKey) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };

    const handleDeepLink = async ({ url }: { url: string }) => {
      const token = new URL(url).searchParams.get('token');
      if (token) {
        setIsProcessingAuth(true);
        try {
          const sessionKey = await getMobileSession(token);
          const userInfo = await getUserInfo(sessionKey);

          await SecureStore.setItemAsync(STORAGE_KEYS.LASTFM_USERNAME, userInfo.name);
          await SecureStore.setItemAsync(STORAGE_KEYS.LASTFM_SESSION, sessionKey);

          // Link user to analytics session and track login
          await analytics.linkUser(userInfo.name);
          await analytics.trackLogin(userInfo.name);

          setIsLoggedIn(true);
        } catch (error) {
          console.error('Failed to process Last.fm auth token:', error);
          setIsProcessingAuth(false);
        }
      }
    };

    checkInitialLogin();

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isLoggedIn === true) {
      router.replace('/(tabs)/home');
    }
  }, [isLoggedIn]);

  return { isLoggedIn, isProcessingAuth };
}
