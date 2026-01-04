/**
 * Hook for managing chat messages state.
 * Handles message list, system messages, and message updates.
 */

import { useState, useCallback } from 'react';
import type { Message } from '../types';

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  const addSystemMessage = useCallback((text: string, idPrefix = 'system') => {
    const systemMessage: Message = {
      id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      senderId: 'system',
      senderName: 'System',
      text,
      timestamp: Date.now(),
      isSystemMessage: true,
    };
    setMessages((prev) => [...prev, systemMessage]);
  }, []);

  const handleMessagesUpdate = useCallback((newMessages: Message[]) => {
    if (Array.isArray(newMessages) && newMessages.length > 0) {
      // Check if this is a full history load or individual messages
      if (newMessages.length > 1) {
        // Full history - replace all messages
        setMessages(newMessages);
      } else {
        // Single new message - append
        setMessages((prev) => [...prev, ...newMessages]);
      }
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addSystemMessage,
    handleMessagesUpdate,
    clearMessages,
  };
}
