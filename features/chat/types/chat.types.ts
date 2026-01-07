/**
 * Type definitions for chat feature.
 */

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystemMessage?: boolean;
  senderImage?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface TypingIndicator {
  isTyping: boolean;
  message: string;
}

export interface UserInfo {
  id: string;
  name: string;
  image?: string | null;
}
