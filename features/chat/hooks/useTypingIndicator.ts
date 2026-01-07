/**
 * Hook for managing typing indicator state and debouncing.
 * Handles typing status tracking with auto-timeout.
 */

import { useState, useRef, useCallback } from 'react';
import type { TypingIndicator } from '../types';

interface UseTypingIndicatorProps {
  sendTyping: (isTyping: boolean) => void;
}

export function useTypingIndicator({ sendTyping }: UseTypingIndicatorProps) {
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({
    isTyping: false,
    message: '',
  });
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypingUpdate = useCallback((indicator: TypingIndicator) => {
    setTypingIndicator(indicator);
  }, []);

  const handleInputChange = useCallback(
    (text: string, onTextChange: (text: string) => void) => {
      onTextChange(text);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTyping(text.length > 0);
      if (text.length > 0) {
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
      }
    },
    [sendTyping]
  );

  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  return {
    typingIndicator,
    handleTypingUpdate,
    handleInputChange,
    cleanup,
  };
}
