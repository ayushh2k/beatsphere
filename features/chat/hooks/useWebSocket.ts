/**
 * Hook for managing WebSocket connection to chat server.
 * Handles connection, reconnection, and message routing.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, API_ENDPOINTS } from '@/config/constants';
import type { ConnectionStatus, Message, UserInfo, TypingIndicator } from '../types';
import { filterCurseWords } from '@/utils/curseWordFilter';

interface UseWebSocketProps {
  onMessagesUpdate: (messages: Message[]) => void;
  onOnlineCountUpdate: (count: number) => void;
  onTypingUpdate: (indicator: TypingIndicator) => void;
  onSystemMessage: (text: string) => void;
}

export function useWebSocket({
  onMessagesUpdate,
  onOnlineCountUpdate,
  onTypingUpdate,
  onSystemMessage,
}: UseWebSocketProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  
  // Keep latest callbacks in a ref to avoid dependencies in 'connect'
  const callbacksRef = useRef({
    onMessagesUpdate,
    onOnlineCountUpdate,
    onTypingUpdate,
    onSystemMessage,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMessagesUpdate,
      onOnlineCountUpdate,
      onTypingUpdate,
      onSystemMessage,
    };
  }, [onMessagesUpdate, onOnlineCountUpdate, onTypingUpdate, onSystemMessage]);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueueRef = useRef<string | null>(null);
  const userInfoRef = useRef<UserInfo | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const connect = useCallback((retryCount: number) => {
    const sessionKey = sessionKeyRef.current;
    if (!userInfoRef.current || !sessionKey || ws.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus(retryCount === 0 ? 'connecting' : 'reconnecting');
    const { onSystemMessage, onMessagesUpdate, onOnlineCountUpdate, onTypingUpdate } = callbacksRef.current;

    const message =
      retryCount === 0 ? 'Connecting to chat... 📡' : 'Connection lost. Reconnecting... 🔌';
    onSystemMessage(message);

    const authenticatedUrl = `${API_ENDPOINTS.WEBSOCKET}?token=${sessionKey}`;
    ws.current = new WebSocket(authenticatedUrl);

    ws.current.onopen = () => {
      if (!isMountedRef.current) return;
      setConnectionStatus('connected');
      callbacksRef.current.onSystemMessage('Connection established. Welcome! ✅');
      ws.current?.send(
        JSON.stringify({
          event: 'join',
          data: {
            username: userInfoRef.current!.id,
          },
        })
      );
      if (messageQueueRef.current) {
        sendMessage(messageQueueRef.current);
        messageQueueRef.current = null;
      }
    };

    ws.current.onerror = (e) => {
      if (!isMountedRef.current) return;
      // Extract meaningful error message if possible
      const errorMessage = (e as any).message || 'Unknown WebSocket error';
      console.error('WebSocket Error:', errorMessage, e);
      callbacksRef.current.onSystemMessage(`Connection error: ${errorMessage} ⚠️`);
    };

    ws.current.onmessage = (event) => {
      if (!isMountedRef.current) return;
      const message = JSON.parse(event.data);
      const eventType = message.event || message.type;
      
      const { onMessagesUpdate, onOnlineCountUpdate, onTypingUpdate } = callbacksRef.current;

      switch (eventType) {
        case 'history':
          const historyMessages = Array.isArray(message.data) ? message.data : message;
          const mappedHistory = historyMessages.map((msg: any) => ({
            id: msg.id?.toString() || Date.now().toString(),
            senderId: msg.username || msg.senderId || msg.userId?.toString(),
            senderName: msg.username || msg.senderName,
            senderImage: msg.profilePic || msg.senderImage,
            text: filterCurseWords(msg.content || msg.text),
            timestamp: new Date(msg.createdAt || msg.timestamp).getTime(),
          }));
          onMessagesUpdate(mappedHistory);
          break;

        case 'globalMessage':
          const newMsg = message.data || message;
          const formattedMsg: Message = {
            id: newMsg.id?.toString() || Date.now().toString(),
            senderId: newMsg.username || newMsg.senderId || newMsg.userId?.toString(),
            senderName: newMsg.username || newMsg.senderName,
            senderImage: newMsg.profilePic || newMsg.senderImage,
            text: filterCurseWords(newMsg.content || newMsg.text),
            timestamp: new Date(newMsg.createdAt || newMsg.timestamp).getTime(),
          };
          onMessagesUpdate([formattedMsg]);
          break;

        case 'active_users':
          const activeUsers = message.data || message;
          onOnlineCountUpdate(Array.isArray(activeUsers) ? activeUsers.length : 0);
          break;

        case 'typingUpdate':
          const typingData = message.data || message;
          let otherTypers: UserInfo[] = [];

          if (typingData.users && Array.isArray(typingData.users)) {
            otherTypers = typingData.users.filter(
              (typer: UserInfo) => typer.id !== userInfoRef.current?.id
            );
          } else if (typingData.isTyping && typingData.user) {
            if (typingData.user.id !== userInfoRef.current?.id) {
              otherTypers = [typingData.user];
            }
          }

          let indicatorMessage = '';
          if (otherTypers.length === 1) {
            indicatorMessage = `${otherTypers[0].name} is typing...`;
          } else if (otherTypers.length > 1) {
            indicatorMessage = 'Several people are typing...';
          }
          onTypingUpdate({ isTyping: otherTypers.length > 0, message: indicatorMessage });
          break;
      }
    };

    ws.current.onclose = () => {
      if (!isMountedRef.current) return;
      callbacksRef.current.onTypingUpdate({ isTyping: false, message: '' });
      
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      reconnectTimeoutRef.current = setTimeout(() => connect(retryCount + 1), delay);
    };
  }, []); // Only simple, stable dependencies (effectively none needed here as we use refs)

  const initializeUserAndConnect = useCallback(async () => {
    try {
      const id = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_USERNAME);
      const name = (await SecureStore.getItemAsync('display_name')) || id;
      const image = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_USER_IMAGE);
      const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);

      if (!id || !name || !sessionKey) {
        callbacksRef.current.onSystemMessage('Could not start chat. User credentials not found. ❌');
        setConnectionStatus('disconnected');
        return;
      }
      userInfoRef.current = { id, name, image };
      sessionKeyRef.current = sessionKey;

      connect(0);
    } catch (error) {
      console.error('Failed to get user info:', error);
      callbacksRef.current.onSystemMessage('An error occurred while fetching your user data.');
    }
  }, [connect]);

  useEffect(() => {
    // Only verify we have what we need, then run once
    initializeUserAndConnect();
    
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      ws.current?.close();
      // Important: clear onclose to prevents reconnect attempt after unmount
      if (ws.current) ws.current.onclose = null;
    };
  }, [initializeUserAndConnect]);

  const sendMessage = useCallback((text: string) => {
    if (!userInfoRef.current) return;
    if (ws.current?.readyState === WebSocket.OPEN) {
      const filteredText = filterCurseWords(text.trim());
      ws.current.send(
        JSON.stringify({
          event: 'message',
          data: {
            content: filteredText,
            username: userInfoRef.current.id,
          },
        })
      );
    } else {
      messageQueueRef.current = text;
      callbacksRef.current.onSystemMessage('Message queued. Will send upon reconnection.');
      // If disconnected, try to reconnect immediately (reset retry count)
      if (ws.current?.readyState !== WebSocket.OPEN && ws.current?.readyState !== WebSocket.CONNECTING) {
          connect(0);
      }
    }
  }, [connect]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (ws.current?.readyState === WebSocket.OPEN && userInfoRef.current) {
      ws.current.send(
        JSON.stringify({
          event: 'typing',
          data: {
            isTyping,
            user: {
              id: userInfoRef.current.id,
              name: userInfoRef.current.name,
            },
          },
        })
      );
    }
  }, []);

  return {
    connectionStatus,
    sendMessage,
    sendTyping,
    userInfo: userInfoRef.current,
  };
}
