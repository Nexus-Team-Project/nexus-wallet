import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import type { ChatMessage as ChatMessageType } from '../types/chat.types';
import type { Voucher } from '../types/voucher.types';
import { getWelcomeMessage, mockAiResponse } from '../mock/handlers/chat.handler';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import GaliAvatar from '../components/chat/GaliAvatar';
import VoucherDetail from '../components/store/VoucherDetail';

const quickActionsHe = [
  { text: 'הזמן משלוח אוכל', icon: 'dinner_dining', query: 'אוכל' },
  { text: 'המלץ על מתנה', icon: 'thumb_up', query: 'מתנה', isNew: true },
  { text: 'מצא הנחות שוות', icon: 'redeem', query: 'הנחה' },
  { text: 'קנה עכשיו', icon: 'shopping_cart', query: 'קניות' },
];

const quickActionsEn = [
  { text: 'Order food delivery', icon: 'dinner_dining', query: 'food' },
  { text: 'Recommend a gift', icon: 'thumb_up', query: 'gift', isNew: true },
  { text: 'Best discounts', icon: 'redeem', query: 'discount' },
  { text: 'Shop now', icon: 'shopping_cart', query: 'shopping' },
];

export default function AiChatPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHe = language === 'he';

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showPromo, setShowPromo] = useState(true);
  const [welcomeInput, setWelcomeInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const welcome = getWelcomeMessage(isHe);
    setMessages([welcome]);

    const prompt = searchParams.get('q');
    if (prompt) {
      setTimeout(() => {
        handleSendMessage(prompt);
      }, 600);
    }
  }, [isHe, searchParams]);

  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    setIsTyping(true);
    scrollToBottom();

    const aiResponse = await mockAiResponse(text, messages, isHe);

    setIsTyping(false);
    setMessages(prev => [...prev, aiResponse]);
    scrollToBottom();
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleNewChat = () => {
    initialized.current = false;
    setMessages([]);
    setShowPromo(true);
    setWelcomeInput('');
    setTimeout(() => {
      const welcome = getWelcomeMessage(isHe);
      setMessages([welcome]);
    }, 100);
  };

  const handleWelcomeSend = () => {
    const trimmed = welcomeInput.trim();
    if (!trimmed) return;
    setWelcomeInput('');
    handleSendMessage(trimmed);
  };

  const hasConversation = messages.length > 1;
  const quickActions = isHe ? quickActionsHe : quickActionsEn;

  /* ── Welcome state ─────────────────────────────────────────────────────── */
  if (!hasConversation) {
    return (
      <div className="flex flex-col relative overflow-hidden min-h-[70vh]">
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, #f5e6f0 0%, #efe0f5 30%, #f7f0fb 55%, #ffffff 80%)',
          }}
        />

        <div className="relative z-10 flex flex-col flex-1">
          {/* Spacer */}
          <div className="flex-1 min-h-[120px]" />

          {/* Input area */}
          <div className="px-6 mb-4">
            <input
              type="text"
              value={welcomeInput}
              onChange={(e) => setWelcomeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleWelcomeSend();
              }}
              placeholder={isHe ? 'הקלד כדי לכתוב' : 'Tap to type'}
              className="w-full text-[22px] font-light bg-transparent outline-none placeholder:text-gray-300 text-text-primary"
            />
          </div>

          {/* Bottom sheet */}
          <div className="bg-white rounded-t-[28px] shadow-[0_-2px_24px_rgba(0,0,0,0.06)] animate-fade-up">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-3">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Promo card */}
            {showPromo && (
              <div className="mx-4 mb-3 relative flex items-center rounded-2xl overflow-hidden border border-gray-100 bg-[#f9f8fb]">
                {/* Left image (partially visible) */}
                <img
                  src="/coffee.png"
                  alt=""
                  className="w-14 h-full object-cover shrink-0"
                  style={{ marginInlineStart: '-6px' }}
                />
                {/* Text content */}
                <div className="flex-1 py-3.5 px-3 min-w-0">
                  <p className="text-[13px] font-semibold text-text-primary leading-snug">
                    {isHe
                      ? 'אני רוצה למצוא הטבות'
                      : 'I want to find great deals'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed whitespace-pre-line">
                    {isHe
                      ? 'הטבות ושוברים מהחנויות\nהאהובות עליך'
                      : 'Deals and vouchers from\nyour favorite stores'}
                  </p>
                </div>
                {/* Right image */}
                <img
                  src="/shoe.png"
                  alt=""
                  className="w-24 h-[72px] object-contain shrink-0"
                />
                {/* Close button */}
                <button
                  onClick={() => setShowPromo(false)}
                  className="absolute top-2 end-2 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '16px' }}
                  >
                    close
                  </span>
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="px-3 pb-10">
              {quickActions.map((action) => (
                <button
                  key={action.text}
                  onClick={() => handleSendMessage(action.query)}
                  className="flex items-center gap-4 w-full py-3.5 px-3 text-start hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
                >
                  <span
                    className="material-symbols-outlined text-gray-300"
                    style={{ fontSize: '24px' }}
                  >
                    {action.icon}
                  </span>
                  <span className="text-[15px] text-gray-400 font-medium">
                    {action.text}
                  </span>
                  {action.isNew && (
                    <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Conversation state ────────────────────────────────────────────────── */
  return (
      <div className="bg-white flex flex-col min-h-[70vh] animate-fade-in">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors"
            >
              <span
                className="material-symbols-outlined text-text-primary"
                style={{ fontSize: '20px' }}
              >
                arrow_back
              </span>
            </button>

            <div className="flex items-center gap-2">
              <GaliAvatar size={28} />
              <span className="text-sm font-bold text-text-primary">
                {isHe ? 'גלי' : 'Gali'}
              </span>
            </div>

            <button
              onClick={handleNewChat}
              className="w-9 h-9 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors"
            >
              <span
                className="material-symbols-outlined text-text-primary"
                style={{ fontSize: '20px' }}
              >
                edit_square
              </span>
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSelectProduct={setSelectedVoucher}
                onSuggestionClick={handleSuggestionClick}
              />
            ))}
          </div>

          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <ChatInput onSend={handleSendMessage} disabled={isTyping} />

        {/* Voucher detail */}
        {selectedVoucher && (
          <VoucherDetail
            voucher={selectedVoucher}
            onClose={() => setSelectedVoucher(null)}
          />
        )}
      </div>
  );
}
