import type { ChatMessage as ChatMessageType } from '../../types/chat.types';
import type { Voucher } from '../../types/voucher.types';
import ProductCard from './ProductCard';
import GaliAvatar from './GaliAvatar';

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectProduct: (voucher: Voucher) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export default function ChatMessage({ message, onSelectProduct, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 px-5 py-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <GaliAvatar size={32} />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-white rounded-2xl rounded-tr-sm'
              : 'bg-surface text-text-primary rounded-2xl rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Inline product cards */}
        {message.products && message.products.length > 0 && (
          <div className="w-full space-y-2">
            {message.products.map((voucher) => (
              <ProductCard
                key={voucher.id}
                voucher={voucher}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}

        {/* Suggestion chips */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                className="px-3 py-1.5 rounded-full bg-white border border-primary/20 text-xs font-medium text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
