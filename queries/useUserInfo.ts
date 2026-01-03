/**
 * Query hook for Last.fm user information.
 */

import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '@/lib/lastfm';
import { queryKeys } from '@/config/queryKeys';
import { CACHE_DURATIONS } from '@/config/constants';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/config/constants';

export function useUserInfo() {
  return useQuery({
    queryKey: queryKeys.lastfm.userInfo('current'),
    queryFn: async () => {
      const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);
      if (!sessionKey) {
        throw new Error('No session key found');
      }
      return getUserInfo(sessionKey);
    },
    staleTime: CACHE_DURATIONS.USER_PROFILE,
  });
}
