import type { ChatMessage as ChatMessageType } from '../../types/chat.types';
import GaliAvatar from './GaliAvatar';

interface ChatMessageProps {
  message: ChatMessageType;
  showAvatar?: boolean;
  /** Hook for inline suggestion chips; accepted but not yet rendered here.
   *  Wired from AiChatSheet so future suggestion UI can plug in without a
   *  prop-API change. */
  onSuggestionClick?: (suggestion: string) => void;
}

export default function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 px-5 py-2 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Avatar — only on the latest AI message */}
      {!isUser && (
        showAvatar ? (
          <div className="flex-shrink-0 mt-1">
            <GaliAvatar size={32} />
          </div>
        ) : (
          <div className="flex-shrink-0 w-8" aria-hidden="true" />
        )
      )}

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? 'items-start' : 'items-end'} flex flex-col gap-2`}>
        <div
          className={`text-sm leading-relaxed ${
            isUser
              ? 'px-3.5 py-2 bg-white/55 backdrop-blur-sm text-text-primary rounded-2xl rounded-tl-sm border border-white/60 shadow-sm'
              : 'text-text-primary'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
