import { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { ChatMessage as ChatMessageType } from '../../types/chat.types';
import type { Voucher } from '../../types/voucher.types';
import { getWelcomeMessage, mockAiResponse } from '../../mock/handlers/chat.handler';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import GaliAvatar from './GaliAvatar';
import VoucherDetail from '../store/VoucherDetail';

interface AiChatSheetProps {
  onClose: () => void;
  initialMessage?: string;
}

export default function AiChatSheet({ onClose, initialMessage }: AiChatSheetProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);
  const initialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const dismiss = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease-out';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 300);
  }, [onClose]);

  // Initialize with welcome message + optional initial message
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const welcome = getWelcomeMessage(isHe);
    setMessages([welcome]);

    // If opened with a suggestion chip, auto-send it
    if (initialMessage) {
      setTimeout(() => {
        handleSendMessage(initialMessage);
      }, 500);
    }
  }, [isHe, initialMessage]);

  // Drag-to-dismiss (native event listeners for passive: false)
  useEffect(() => {
    const headerEl = document.getElementById('ai-chat-header');
    if (!headerEl) return;

    const onTouchStart = (e: TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      currentTranslateY.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none';
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const deltaY = e.touches[0].clientY - dragStartY.current;
      if (deltaY > 0) {
        e.preventDefault();
        currentTranslateY.current = deltaY;
        if (sheetRef.current) {
          sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        }
        if (overlayRef.current) {
          const opacity = Math.max(0, 1 - deltaY / 400);
          overlayRef.current.style.opacity = String(opacity);
        }
      }
    };

    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (currentTranslateY.current > 80) {
        dismiss();
      } else {
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.3s ease-out';
          sheetRef.current.style.transform = 'translateY(0)';
        }
        if (overlayRef.current) {
          overlayRef.current.style.transition = 'opacity 0.3s ease-out';
          overlayRef.current.style.opacity = '1';
        }
      }
      currentTranslateY.current = 0;
    };

    headerEl.addEventListener('touchstart', onTouchStart, { passive: true });
    headerEl.addEventListener('touchmove', onTouchMove, { passive: false });
    headerEl.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      headerEl.removeEventListener('touchstart', onTouchStart);
      headerEl.removeEventListener('touchmove', onTouchMove);
      headerEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [dismiss]);

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    // Show typing
    setIsTyping(true);
    scrollToBottom();

    // Get AI response
    const aiResponse = await mockAiResponse(text, messages, isHe);

    setIsTyping(false);
    setMessages(prev => [...prev, aiResponse]);
    scrollToBottom();
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[60] bg-black/40 animate-fade-in"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[60] bg-white rounded-t-3xl flex flex-col animate-slide-up"
        style={{ maxHeight: '90vh' }}
      >
        {/* Drag Header */}
        <div
          id="ai-chat-header"
          className="flex-shrink-0 select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>

          {/* Title */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <GaliAvatar size={32} />
              <div>
                <h2 className="text-sm font-bold text-text-primary">Nexus</h2>
                <p className="text-[10px] text-text-muted">
                  {isHe ? 'העוזר החכם שלך' : 'Your smart assistant'}
                </p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors"
            >
              <span
                className="material-symbols-outlined text-text-secondary"
                style={{ fontSize: '18px' }}
              >
                close
              </span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain py-3">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={isTyping}
        />
      </div>

      {/* Voucher detail from product cards */}
      {selectedVoucher && (
        <div className="z-[70] relative">
          <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
        </div>
      )}
    </>
  );
}
