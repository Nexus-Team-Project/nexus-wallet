import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import type { ChatMessage as ChatMessageType } from '../types/chat.types';
import type { Voucher, VoucherCategory } from '../types/voucher.types';
import { getWelcomeMessage, mockAiResponse } from '../mock/handlers/chat.handler';
import ChatMessage from '../components/chat/ChatMessage';
import ChatIntroCard from '../components/chat/ChatIntroCard';
import TypingIndicator from '../components/chat/TypingIndicator';
import RecommendationsContent from '../components/chat/RecommendationsSheet';
import DiscountFinderCard from '../components/chat/DiscountFinderCard';
import SearchFiltersView from '../components/chat/SearchFiltersView';
import type { DiscountFinderResult } from '../components/chat/DiscountFinderCard';
import VoucherDetail from '../components/store/VoucherDetail';
import { useRecommendationsStore } from '../stores/recommendationsStore';
import { useChatStore } from '../stores/chatStore';
import { mockVouchers } from '../mock/data/vouchers.mock';

// icon: 'nexus-badge' → render the sky-blue rectangular Nexus badge
// (same one used on the Wallet "balance" label). Otherwise it's a
// material-symbols-outlined icon name.
// kind: 'finder' → opens the inline multi-step discount finder instead of
// sending the query straight to the AI.
const quickActionsHe = [
  { text: 'מצא הנחות שוות', icon: 'local_offer', query: 'מצא לי הנחות', kind: 'finder' as const },
  { text: 'שלם בחנות', icon: 'nexus-badge', query: 'תשלום בחנות' },
  { text: 'קנה אונליין', icon: 'shopping_cart', query: 'קניות אונליין' },
  { text: 'שלח מתנה', icon: 'card_giftcard', query: 'מתנה', isNew: true },
];

const quickActionsEn = [
  { text: 'Best discounts', icon: 'local_offer', query: 'Find me discounts', kind: 'finder' as const },
  { text: 'Pay in store', icon: 'nexus-badge', query: 'pay in store' },
  { text: 'Buy online', icon: 'shopping_cart', query: 'shopping online' },
  { text: 'Send a gift', icon: 'card_giftcard', query: 'gift', isNew: true },
];

const CATEGORY_LABELS_HE: Record<string, string> = {
  food: 'אוכל',
  shopping: 'קניות',
  entertainment: 'בידור',
  tech: 'טכנולוגיה',
  travel: 'טיולים',
  health: 'בריאות',
  education: 'לימודים',
};

const popularSearchesHe = [
  'מתנה לחבר',
  'פיצה איטלקית',
  'סופ״ש בצפון',
  'בית קפה רגוע',
  'נעלי ספורט במבצע',
  'סרט חדש בקולנוע',
  'מחשב נייד חדש',
  'איפור לאירוע',
];

const popularSearchesEn = [
  'Gift for a friend',
  'Italian pizza',
  'Weekend trip',
  'Cozy cafe',
  'Sneakers on sale',
  'New movie',
  'New laptop',
  'Makeup for an event',
];

const SHEET_TRANSITION_MS = 420;
const SHEET_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SHEET_EXPANDED_FRAC = 0.75; // 75dvh — leaves the input + a couple messages visible above
const SHEET_EXPANDED_HEIGHT = `${SHEET_EXPANDED_FRAC * 100}dvh`;
// Drag past the expanded ceiling by more than this many px → navigate to
// home (or to the full map page when the sheet is in map mode).
// Visible (post-rubber-band) threshold; the felt finger distance is
// `SHEET_NAVIGATE_OVERDRAG_PX / SHEET_OVERDRAG_RESISTANCE`. Keep the felt
// distance ~40-60px so it's a deliberate gesture, not accidental.
const SHEET_NAVIGATE_OVERDRAG_PX = 30;
const SHEET_OVERDRAG_CEILING_PX = 180;
const SHEET_OVERDRAG_RESISTANCE = 0.7;

// 'normal'      — natural height (welcome promo / quick actions / convo filler)
// 'expanded'    — recommendations visible, sheet at SHEET_EXPANDED_HEIGHT
// 'collapsing'  — recommendations still rendered but sheet is animating back down
type SheetState = 'normal' | 'expanded' | 'collapsing';

export default function AiChatPage() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const setStorePicks = useRecommendationsStore((s) => s.setPicks);
  // Mounts the floating human-agent FAB (AppLayout subscribes to this).
  const setHumanChatActive = useChatStore((s) => s.setHumanChatActive);
  const isHe = language === 'he';

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showPromo, setShowPromo] = useState(true);
  const [welcomeInput, setWelcomeInput] = useState('');
  // Input position: idle (bottom, original) vs active (end of thread).
  // Activates after the bottom-trigger placeholder swipes off to the left.
  const [inputActive, setInputActive] = useState(false);
  // True while the "Tap to type" placeholder is swiping off-screen, before
  // the active input is mounted at its in-thread position.
  const [triggerSwiping, setTriggerSwiping] = useState(false);
  const activeInputRef = useRef<HTMLInputElement>(null);

  // Welcome content (promo + popular searches + quick actions) starts open
  // and collapses on the user's first meaningful action — typing a message
  // or picking a filter inside the discount finder.
  const [welcomeCollapsed, setWelcomeCollapsed] = useState(false);
  const markActivity = useCallback(() => setWelcomeCollapsed(true), []);
  const [recommendations, setRecommendations] = useState<{ products: Voucher[]; intro: string } | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>('normal');
  // Seeds the DiscountFinderCard's category chip when the finder is opened
  // from a category page (via ?finder=<categoryId>).
  const [finderInitialCategory, setFinderInitialCategory] = useState<VoucherCategory | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const collapseTimeout = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  // Mirrors RecommendationsContent's view mode so an over-drag past the
  // sheet's ceiling routes to the full map page when the user is viewing
  // the map (otherwise it goes to home).
  const sheetViewModeRef = useRef<'list' | 'map'>('list');

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

    // ?finder=<categoryId> — launched from a category page's search pill.
    // Validate the param against the known VoucherCategory keys, seed the
    // finder card with the matching category and open it immediately.
    const finderParam = searchParams.get('finder');
    if (finderParam && finderParam in CATEGORY_LABELS_HE) {
      const cat = finderParam as VoucherCategory;
      setFinderInitialCategory(cat);
      markActivity();
      setTimeout(() => openDiscountFinder(''), 200);
    }
  }, [isHe, searchParams]);

  // Cleanup pending collapse timer on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeout.current) window.clearTimeout(collapseTimeout.current);
    };
  }, []);

  // When the input switches to its active (in-thread) position, focus it so
  // the user keeps typing seamlessly. Also scroll the new position into view.
  useEffect(() => {
    if (inputActive) {
      const id = requestAnimationFrame(() => {
        activeInputRef.current?.focus();
        activeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [inputActive]);

  // Derived state — must be declared before the drag useEffect that reads it
  const showingRecommendations = sheetState !== 'normal';
  const sheetExpanded = sheetState === 'expanded';

  // Collapse the sheet WITHOUT clearing recommendations data — the user can
  // pull it back up. Recommendations are only cleared on "new chat".
  const collapseSheet = useCallback(() => {
    if (sheetState !== 'expanded') return;
    setSheetState('collapsing');
    if (collapseTimeout.current) window.clearTimeout(collapseTimeout.current);
    collapseTimeout.current = window.setTimeout(() => {
      setSheetState('normal');
      collapseTimeout.current = null;
    }, SHEET_TRANSITION_MS);
  }, [sheetState]);

  const expandSheet = useCallback(() => {
    if (collapseTimeout.current) {
      window.clearTimeout(collapseTimeout.current);
      collapseTimeout.current = null;
    }
    setSheetState('expanded');
  }, []);

  // Drag handle gesture — bidirectional, enabled whenever the sheet has
  // content (recommendations OR a loading skeleton). Drag up always rises
  // (clamped to expanded height); drag down shrinks and collapses past
  // threshold, else snaps back. A tap toggles open/closed.
  const hasSheetContent = !!recommendations || loadingRecs;
  useEffect(() => {
    if (!hasSheetContent) return; // nothing to peek at — drag is inert
    const handle = dragHandleRef.current;
    const wrapper = wrapperRef.current;
    if (!handle || !wrapper) return;

    let startY = 0;
    let dragging = false;
    let delta = 0;
    let startHeight = 0;
    let maxHeight = 0;
    let lastHeight = 0;

    const computeHeight = (raw: number): number => {
      if (raw <= 0) return 0;
      if (raw <= maxHeight) return raw;
      // Over-drag: apply rubber-band resistance and cap so the sheet doesn't
      // visually punch through the top of the screen.
      const overshoot = raw - maxHeight;
      return maxHeight + Math.min(SHEET_OVERDRAG_CEILING_PX, overshoot * SHEET_OVERDRAG_RESISTANCE);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startY = e.clientY;
      dragging = true;
      delta = 0;
      startHeight = wrapper.getBoundingClientRect().height;
      lastHeight = startHeight;
      maxHeight = window.innerHeight * SHEET_EXPANDED_FRAC;
      wrapper.style.transition = 'none';
      try { handle.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      delta = e.clientY - startY;
      // delta > 0 → drag down → shrink. delta < 0 → drag up → grow.
      lastHeight = computeHeight(startHeight - delta);
      wrapper.style.height = `${lastHeight}px`;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      wrapper.style.transition = `height ${SHEET_TRANSITION_MS}ms ${SHEET_EASING}`;

      const TAP_PX = 5;
      const SNAP_FRAC = 0.4;

      // Drag past the expanded ceiling → navigate. When the sheet is in map
      // mode, go to the full map page so the user keeps the spatial context;
      // otherwise fall back to home, which surfaces the same picks in its
      // "Nexus picks for you" row.
      if (lastHeight > maxHeight + SHEET_NAVIGATE_OVERDRAG_PX) {
        // Snap the sheet back down so it isn't left wide-open on return.
        wrapper.style.height = '0px';
        if (sheetExpanded) collapseSheet();
        const tenantParam = searchParams.get('tenant');
        const target = sheetViewModeRef.current === 'map'
          ? `/${lang}/near-you-map`
          : `/${lang}`;
        navigate(`${target}${tenantParam ? `?tenant=${tenantParam}` : ''}`);
        delta = 0;
        return;
      }

      if (Math.abs(delta) < TAP_PX) {
        // Tap — toggle
        if (sheetExpanded) {
          wrapper.style.height = '0px';
          collapseSheet();
        } else {
          wrapper.style.height = `${maxHeight}px`;
          expandSheet();
        }
      } else if (lastHeight >= maxHeight * SNAP_FRAC) {
        // Past 40% open — snap to expanded
        wrapper.style.height = `${maxHeight}px`;
        if (!sheetExpanded) expandSheet();
      } else {
        // Below 40% open — snap closed
        wrapper.style.height = '0px';
        if (sheetExpanded) collapseSheet();
      }
      delta = 0;
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
    return () => {
      handle.removeEventListener('pointerdown', onPointerDown);
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
      handle.removeEventListener('pointercancel', onPointerUp);
    };
  }, [hasSheetContent, sheetExpanded, collapseSheet, expandSheet, navigate, lang, searchParams]);

  const handleSendMessage = async (text: string) => {
    markActivity();
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

    try {
      const aiResponse = await mockAiResponse(text, messages, isHe);
      setMessages(prev => [...prev, aiResponse]);
      scrollToBottom();

      // Save products silently so the drag handle can reveal them, but
      // DON'T auto-expand the sheet over the chat. Auto-expand only happens
      // for explicit product flows (the discount finder).
      if (aiResponse.products && aiResponse.products.length > 0) {
        setRecommendations({ products: aiResponse.products, intro: aiResponse.content });
        setStorePicks(aiResponse.products, aiResponse.content);
      }
    } finally {
      // Always clear typing so the input doesn't stay disabled if the
      // mock/API throws.
      setIsTyping(false);
    }
  };

  // Opens the inline discount finder card. The finder's own header carries
  // the "Find me deals" phrasing, so we don't add a user-message bubble for
  // the quick-action label — that would just duplicate the intent.
  // Idempotent: if a finder is already open, re-clicking the quick action
  // just scrolls to the existing card instead of stacking duplicates.
  const openDiscountFinder = (_userText: string) => {
    setMessages((prev) => {
      if (prev.some((m) => m.type === 'finder')) return prev;
      const finderMessage: ChatMessageType = {
        id: `finder_${Date.now()}`,
        role: 'assistant',
        type: 'finder',
        content: isHe
          ? 'בוא נצמצם את החיפוש — בחר קטגוריה כדי להתחיל.'
          : "Let's narrow it down — pick a category to start.",
        timestamp: new Date(),
      };
      return [...prev, finderMessage];
    });
    scrollToBottom();
  };

  // Popular-search picks inside the finder card behave like a filter, not a
  // chat message — pop the sheet with results instead of letting the AI
  // respond inline. We still reuse the mock keyword matcher to map free-form
  // query text → vouchers.
  const handleFinderSearch = async (query: string) => {
    markActivity();
    setRecommendations(null);
    setLoadingRecs(true);
    requestAnimationFrame(() => expandSheet());

    const aiResponse = await mockAiResponse(query, messages, isHe);
    const products = aiResponse.products ?? [];

    setRecommendations({ products, intro: aiResponse.content });
    setStorePicks(products, aiResponse.content);
    setLoadingRecs(false);
  };

  const handleFinderComplete = (result: DiscountFinderResult) => {
    // Filter vouchers locally by category + min discount. Subcategory is
    // surfaced in the chat copy but doesn't have data to filter on yet.
    const filtered = mockVouchers
      .filter((v) => v.category === result.category)
      .filter((v) => v.discountPercent >= result.minDiscount);

    const intro = isHe
      ? `מצאתי ${filtered.length} הטבות ב${CATEGORY_LABELS_HE[result.category]} (${result.subcategory}) עם הנחה של ${result.minDiscount}%+`
      : `Found ${filtered.length} deals in ${result.category} (${result.subcategory}) at ${result.minDiscount}%+ off`;

    if (filtered.length === 0) {
      const noResults: ChatMessageType = {
        id: `noresults_${Date.now()}`,
        role: 'assistant',
        content: isHe
          ? 'לא מצאתי הטבות שמתאימות לסינון הזה. נסה טווח הנחה אחר.'
          : "I couldn't find any deals matching this filter. Try a different range.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, noResults]);
      scrollToBottom();
      return;
    }

    // Flash the skeleton: clear old data, mark loading, open the sheet
    // immediately with the gradient skeleton cards. After a short beat
    // swap in the real results.
    setRecommendations(null);
    setLoadingRecs(true);
    requestAnimationFrame(() => expandSheet());
    window.setTimeout(() => {
      setRecommendations({ products: filtered, intro });
      setStorePicks(filtered, intro);
      setLoadingRecs(false);
    }, 700);
  };

  // Escape hatch from the AI flow → connect to a human agent. Flips the
  // shared chat-store flag so AppLayout mounts the human-agent FAB, and
  // appends an assistant bubble so the user has immediate confirmation
  // that the request landed. Welcome content collapses out of the way.
  const requestHumanAgent = () => {
    markActivity();
    setHumanChatActive(true);
    const sysMsg: ChatMessageType = {
      id: `agent_${Date.now()}`,
      role: 'assistant',
      content: isHe
        ? 'מחבר אותך עם נציג אנושי. אנא המתן רגע…'
        : 'Connecting you to a human agent. One moment…',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, sysMsg]);
    scrollToBottom();
  };

  const handleNewChat = () => {
    initialized.current = false;
    setMessages([]);
    setShowPromo(true);
    setWelcomeInput('');
    setRecommendations(null);
    setLoadingRecs(false);
    setSheetState('normal');
    setWelcomeCollapsed(false);
    setTimeout(() => {
      const welcome = getWelcomeMessage(isHe);
      setMessages([welcome]);
    }, 100);
  };

  const handleWelcomeSend = () => {
    const trimmed = welcomeInput.trim();
    if (!trimmed) return;
    setWelcomeInput('');
    // Keep the input active so the user can keep typing next messages
    // without re-tapping the bottom trigger. Refocus on the next frame in
    // case the send moved focus away.
    requestAnimationFrame(() => activeInputRef.current?.focus());
    handleSendMessage(trimmed);
  };

  // Tapping the bottom "לחץ כדי לכתוב" trigger: swipe the placeholder
  // text off to the left with a fade, then mount the active input (cursor
  // is all that remains where the input lives).
  const activateInput = () => {
    if (triggerSwiping || inputActive) return;
    setTriggerSwiping(true);
    // Match the keyframe duration in index.css (input-swipe-left: 420ms)
    // so the trigger unmounts only after the placeholder has fully swept off.
    window.setTimeout(() => {
      setInputActive(true);
      setTriggerSwiping(false);
    }, 420);
  };

  const hasConversation = messages.length > 1;
  const quickActions = isHe ? quickActionsHe : quickActionsEn;
  const popularSearches = isHe ? popularSearchesHe : popularSearchesEn;
  // Filter summary view is visible whenever there are search results and the
  // recommendations sheet isn't expanded over them.
  const showSearchFilters = !!recommendations && sheetState !== 'expanded';
  const lastAiIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role !== 'user') return i;
    }
    return -1;
  })();

  // Active input element — defined once, mounted at the end of the message
  // thread when `inputActive`. Single ref so focus follows it.
  const activeInputNode = (
    <div className="px-6 mb-2 flex items-center gap-2">
      <input
        ref={activeInputRef}
        type="text"
        value={welcomeInput}
        onChange={(e) => setWelcomeInput(e.target.value)}
        onKeyDown={(e) => {
          // Block double-send while waiting for the AI, but don't disable the
          // input — we want the placeholder + cursor visible the whole time.
          if (e.key === 'Enter' && !isTyping) handleWelcomeSend();
          if (e.key === 'Escape') {
            setWelcomeInput('');
            setInputActive(false);
          }
        }}
        onBlur={() => {
          if (!welcomeInput.trim()) {
            setTimeout(() => setInputActive(false), 120);
          }
        }}
        placeholder={isHe ? 'הקלד' : 'Type'}
        className="flex-1 text-[22px] font-light bg-transparent outline-none placeholder:text-gray-300 focus:placeholder:text-gray-300 text-text-primary caret-primary"
      />
      {hasConversation && (
        <button
          onClick={handleNewChat}
          aria-label={isHe ? 'שיחה חדשה' : 'New chat'}
          className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white active:scale-95 transition-all"
        >
          <span
            className="material-symbols-outlined text-text-primary"
            style={{ fontSize: '18px' }}
          >
            edit_square
          </span>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col relative overflow-hidden min-h-[100dvh]">
      {/* Gradient background — curtains down from above on page entry,
          meeting the bottom sheet rising from below for the "land on the
          card" feel. The outer page has overflow-hidden so the initial
          translateY(-100%) state is clipped (no flash of empty space). */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, #f5e6f0 0%, #efe0f5 30%, #f7f0fb 55%, #ffffff 80%)',
          animation: 'chat-pink-curtain 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
          willChange: 'transform',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 min-h-[100dvh]">
        {/* Messages / thread area — the input renders INLINE as the last item
            in the thread when active. That way it sits at the "next user
            bubble" position: at the top when the thread is empty (welcome
            state), and right below the latest AI response after a
            conversation has started.

            Once we have search results AND the sheet has been pulled back
            down (sheetState === 'normal'), swap the thread for the filter
            summary view so the user can adjust their filters. */}
        <div className="flex-1 overflow-y-auto">
          {showSearchFilters && recommendations ? (
            // Filter-summary mode: SearchFiltersView at the top, new chat
            // messages render below it, then the active input pinned to the
            // bottom. Each new send appends to the thread between filters
            // and input so messages stack downward.
            <div className="pt-20 pb-4">
              <SearchFiltersView vouchers={recommendations.products} />

              {messages.map((msg, i) => {
                if (msg.id === 'welcome') return null;
                if (msg.type === 'finder') return null; // hidden while filters are open
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    showAvatar={i === lastAiIndex && !isTyping}
                  />
                );
              })}
              {isTyping && <TypingIndicator />}
              {inputActive && activeInputNode}
              <div ref={messagesEndRef} />
            </div>
          ) : hasConversation ? (
            <div className="pt-20 pb-4">
              {messages.map((msg, i) => {
                if (msg.id === 'welcome') return null;
                if (msg.type === 'finder') {
                  return (
                    <DiscountFinderCard
                      key={msg.id}
                      onComplete={handleFinderComplete}
                      onInteract={markActivity}
                      popularSearches={popularSearches}
                      onSearchQuery={handleFinderSearch}
                      initialCategory={finderInitialCategory}
                    />
                  );
                }
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    showAvatar={i === lastAiIndex && !isTyping}
                  />
                );
              })}
              {isTyping && <TypingIndicator />}
              {inputActive && activeInputNode}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="pt-20 pb-4">
              <ChatIntroCard />
              {inputActive && activeInputNode}
            </div>
          )}
        </div>

        {/* Idle bottom trigger — looks like the original input bar but is a
            tap target. Tapping swipes the placeholder text off to the left
            with a fade, then promotes the input to its active in-thread
            position (where a cursor is all that remains). */}
        {!inputActive && (
          <button
            type="button"
            onClick={activateInput}
            // Only disable for actual typing (network call). Don't disable
            // during the swipe — `disabled:opacity-60` would jump the button
            // to 0.6 opacity mid-keyframe and make the animation feel stuck.
            disabled={isTyping}
            aria-disabled={triggerSwiping || undefined}
            className="px-6 mb-4 flex items-center gap-2 w-full text-start flex-shrink-0 disabled:opacity-60 overflow-hidden"
          >
            <span
              className="flex-1 text-[22px] font-light text-gray-300 whitespace-nowrap will-change-transform"
              style={
                triggerSwiping
                  ? { animation: 'input-swipe-left 420ms cubic-bezier(0.32, 0.72, 0, 1) forwards' }
                  : undefined
              }
            >
              {isHe ? 'לחץ כדי לכתוב' : 'Tap to type'}
            </span>
            {hasConversation && (
              <span
                aria-label={isHe ? 'שיחה חדשה' : 'New chat'}
                className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewChat();
                }}
              >
                <span
                  className="material-symbols-outlined text-text-primary"
                  style={{ fontSize: '18px' }}
                >
                  edit_square
                </span>
              </span>
            )}
          </button>
        )}

        {/* Bottom sheet — the same sheet expands to host recommendations.
            The expansion is driven by an inner wrapper whose height animates
            from 0 → sheet expanded height. The drag handle floats as an
            absolute overlay at the top so the wrapper's content (e.g. the
            full-bleed map) can fill the sheet edge-to-edge. */}
        <div
          className="bg-white rounded-t-[28px] shadow-[0_-2px_24px_rgba(0,0,0,0.06)] relative flex flex-col"
          style={{
            maxHeight: SHEET_EXPANDED_HEIGHT,
            // Rises from below on mount, in sync with the gradient curtain
            // above — together they "close in" on the card as the focal
            // landing point.
            animation: 'chat-sheet-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
            willChange: 'transform',
          }}
        >
          {/* Drag handle — absolute overlay on top of the wrapper. Pointer
              events drive drag-up/down; tap toggles the welcome content. */}
          <button
            ref={dragHandleRef}
            type="button"
            onClick={() => {
              if (!hasSheetContent) {
                setWelcomeCollapsed((prev) => !prev);
              }
            }}
            aria-label={
              isHe
                ? (sheetExpanded ? 'סגור המלצות' : 'פתח המלצות')
                : (sheetExpanded ? 'Close recommendations' : 'Open recommendations')
            }
            className="absolute top-0 inset-x-0 z-30 flex justify-center pt-3 pb-3 w-full pointer-events-auto"
            style={{ touchAction: hasSheetContent ? 'none' : 'auto' }}
          >
            <div className="w-10 h-1 rounded-full bg-gray-300 shadow-sm pointer-events-none" />
          </button>

          {/* Animated content wrapper — height drives the rise. Now takes the
              full sheet height when expanded (drag handle floats above it),
              so the inner map view can extend to the top edge of the card. */}
          <div
            ref={wrapperRef}
            className="overflow-hidden flex-shrink-0 flex flex-col"
            style={{
              height: sheetExpanded ? SHEET_EXPANDED_HEIGHT : '0px',
              transition: `height ${SHEET_TRANSITION_MS}ms ${SHEET_EASING}`,
              willChange: 'height',
            }}
          >
            {hasSheetContent && (
              <RecommendationsContent
                vouchers={recommendations?.products}
                intro={recommendations?.intro}
                loading={loadingRecs}
                onSelect={(v) => {
                  setSelectedVoucher(v);
                  collapseSheet();
                }}
                onViewModeChange={(mode) => { sheetViewModeRef.current = mode; }}
              />
            )}
          </div>

          {/* Welcome content — animates closed on the user's first action,
              re-opens on tapping the drag handle. Hidden entirely while the
              sheet is showing recommendations. */}
          {!showingRecommendations && (
            <div
              className="overflow-hidden flex-shrink-0 pt-9"
              style={{
                maxHeight: welcomeCollapsed ? '0px' : '800px',
                transition: `max-height ${SHEET_TRANSITION_MS}ms ${SHEET_EASING}`,
              }}
            >
              {/* Promo card — welcome state only */}
              {showPromo && (
                <div className="mx-4 mb-3 relative flex items-center rounded-2xl overflow-hidden border border-gray-100 bg-[#f9f8fb]">
                  <img
                    src="/coffee.png"
                    alt=""
                    className="w-14 h-full object-cover shrink-0"
                    style={{ marginInlineStart: '-6px' }}
                  />
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
                  <img
                    src="/shoe.png"
                    alt=""
                    className="w-24 h-[72px] object-contain shrink-0"
                  />
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

              {/* Quick actions — always visible while there are no
                  recommendation results showing in the sheet
                  (popular searches moved into the finder's search dropdown) */}
              {(
                <div className="px-3 pb-10">
                  {quickActions.map((action) => (
                    <button
                      key={action.text}
                      onClick={() => {
                        if ('kind' in action && action.kind === 'finder') {
                          openDiscountFinder(action.query);
                        } else {
                          handleSendMessage(action.query);
                        }
                      }}
                      className="flex items-center gap-3 w-full py-3.5 px-3 text-start hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
                    >
                      {/* Fixed-width centered column — keeps every icon's
                          centerline aligned with the Nexus badge above and
                          makes every text label start at the same x. */}
                      <div className="w-24 flex items-center justify-center flex-shrink-0">
                        {action.icon === 'nexus-badge' ? (
                          // Same proportions as the voucher-purchase "Create card with [Nexus]" button:
                          // bg-sky-300 rounded-xl px-2.5 py-1, outer scale(0.873), img h-6 scale(1.373).
                          <span
                            className="inline-flex items-center bg-sky-300 rounded-xl px-2.5 py-1 overflow-hidden"
                            style={{ transform: 'scale(0.873)' }}
                          >
                            <img
                              src="/nexus-logo-black.png"
                              alt="Nexus"
                              className="h-6 w-auto object-contain"
                              style={{ transform: 'scale(1.373)' }}
                            />
                          </span>
                        ) : (
                          <span
                            className="material-symbols-outlined text-gray-300"
                            style={{ fontSize: '24px' }}
                          >
                            {action.icon}
                          </span>
                        )}
                      </div>
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

                  {/* Human-agent escape hatch — rendered as the last
                      row of the quick-actions list so it shares the
                      exact same shape (icon column, muted text, no
                      border) as the items above it. Different intent
                      (hand off to a real person), same visual weight. */}
                  <button
                    type="button"
                    onClick={requestHumanAgent}
                    className="flex items-center gap-3 w-full py-3.5 px-3 text-start hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-24 flex items-center justify-center flex-shrink-0">
                      <span
                        className="material-symbols-outlined text-gray-300"
                        style={{ fontSize: '24px' }}
                      >
                        support_agent
                      </span>
                    </div>
                    <span className="text-[15px] text-gray-400 font-medium">
                      {isHe ? 'סיוע מנציג אנושי' : 'Help from a human'}
                    </span>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

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
