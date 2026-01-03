/**
 * Hook for managing audio preview playback.
 * Wraps the audioManager singleton with React hooks.
 */

import { useState, useCallback, useEffect } from 'react';
import { audioManager } from '@/utils/audioManager';

export function useAudioPreview() {
  const [isMuted, setIsMuted] = useState(audioManager.getMutedState());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize on mount
    audioManager.initialize();
  }, []);

  const play = useCallback(async (url: string | undefined) => {
    if (!url) return;
    await audioManager.playPreview(url);
    setIsPlaying(true);
  }, []);

  const stop = useCallback(async () => {
    await audioManager.stop();
    setIsPlaying(false);
  }, []);

  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    await audioManager.setMuted(newMutedState);
    setIsMuted(newMutedState);
  }, [isMuted]);

  const setMute = useCallback(async (muted: boolean) => {
    await audioManager.setMuted(muted);
    setIsMuted(muted);
  }, []);

  return {
    play,
    stop,
    toggleMute,
    setMute,
    isMuted,
    isPlaying,
  };
}
