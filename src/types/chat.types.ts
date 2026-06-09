import type { Voucher } from './voucher.types';

export type ChatMessageType = 'text' | 'finder';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Optional message variant — defaults to 'text' (regular bubble). */
  type?: ChatMessageType;
  products?: Voucher[];
  suggestions?: string[];
  timestamp: Date;
}
