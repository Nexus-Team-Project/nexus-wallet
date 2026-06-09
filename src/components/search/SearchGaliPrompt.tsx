import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Floating Gali AI avatar that pops up on the Search page.
 * Animation sequence: bounce-in → eyes look right/left → squint → open → bubble appears.
 */
export default function SearchGaliPrompt() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const isHe = language === 'he';

  const [visible, setVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 600);
    // bubble after eyes finish: 600ms wait + 700ms delay + 2s anim = ~3300ms
    const t2 = setTimeout(() => setShowBubble(true), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (dismissed) return null;

  const goChat = () => navigate(`/${lang}/chat`);

  return (
    <>
      <style>{`
        @keyframes gali-bounce-in {
          0%   { transform: scale(0) translateY(30px); opacity: 0; }
          45%  { transform: scale(1.2) translateY(-6px); opacity: 1; }
          65%  { transform: scale(0.92) translateY(2px); }
          82%  { transform: scale(1.06) translateY(-1px); }
          100% { transform: scale(1) translateY(0); }
        }

        @keyframes gali-eye-sequence {
          0%,  8%  { transform: translate(0, 0) scaleY(1); }
          16%, 32% { transform: translate(4px, 0) scaleY(1); }
          40%, 56% { transform: translate(-4px, 0) scaleY(1); }
          64%, 72% { transform: translate(0, 0) scaleY(1); }
          78%, 88% { transform: translate(0, 0) scaleY(0.1); }
          95%, 100%{ transform: translate(0, 0) scaleY(1); }
        }

        @keyframes gali-bubble-in {
          0%   { transform: scale(0) translateY(8px); opacity: 0; }
          55%  { transform: scale(1.07) translateY(-2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes gali-glow-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(99,91,255,0.35); }
          50%      { box-shadow: 0 4px 24px rgba(99,91,255,0.55), 0 0 40px rgba(99,91,255,0.12); }
        }

        @keyframes gali-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
      `}</style>

      <div
        className="fixed z-50 flex flex-col items-end gap-2.5"
        style={{
          bottom: 90,
          right: 16,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Speech bubble */}
        {showBubble && (
          <div
            className="relative"
            style={{
              animation: 'gali-bubble-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              transformOrigin: 'bottom right',
            }}
          >
            <button
              onClick={goChat}
              className="block text-start px-4 py-3 rounded-2xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #635bff 0%, #7c6cff 60%, #a78bfa 100%)',
                maxWidth: 190,
              }}
            >
              {/* Close X */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDismissed(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    setDismissed(true);
                  }
                }}
                className="absolute top-1.5 end-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-white/70 text-[10px] cursor-pointer hover:bg-white/35 transition-colors z-10"
              >
                ✕
              </span>

              <p className="text-[12.5px] font-bold text-white leading-snug pe-5">
                {isHe ? 'לא יודע מה לחפש?' : 'Not sure what to look for?'}
              </p>
              <p className="text-[11px] text-white/80 font-medium mt-1">
                {isHe ? 'שאל את Nexus! ✨' : 'Ask Nexus! ✨'}
              </p>
            </button>

            {/* Tail arrow pointing down toward Gali */}
            <div
              className="absolute -bottom-[6px]"
              style={{
                right: 18,
                width: 14,
                height: 14,
                background: '#7c6cff',
                transform: 'rotate(45deg)',
                borderRadius: '0 0 3px 0',
              }}
            />
          </div>
        )}

        {/* Gali floating head */}
        <div
          style={{
            animation: showBubble ? 'gali-float 3s ease-in-out infinite' : 'none',
          }}
        >
          <button
            onClick={goChat}
            className="relative w-[52px] h-[52px] rounded-full"
            style={{
              animation: visible
                ? 'gali-bounce-in 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                : 'none',
            }}
            aria-label={isHe ? 'שאל את Nexus' : 'Ask Nexus'}
          >
            <div
              className="w-full h-full rounded-full bg-slate-900 relative overflow-hidden"
              style={{
                animation: showBubble
                  ? 'gali-glow-pulse 2.5s ease-in-out infinite'
                  : 'none',
              }}
            >
              {/* Subtle shine */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18) 0%, transparent 55%)',
                }}
              />

              {/* Left eye */}
              <span
                className="absolute rounded-full bg-white"
                style={{
                  width: 9,
                  height: 9,
                  left: 'calc(50% - 12px)',
                  top: 'calc(50% - 4px)',
                  animation: visible
                    ? 'gali-eye-sequence 2s ease-in-out 0.7s both'
                    : 'none',
                }}
              />

              {/* Right eye */}
              <span
                className="absolute rounded-full bg-white"
                style={{
                  width: 9,
                  height: 9,
                  left: 'calc(50% + 3px)',
                  top: 'calc(50% - 4px)',
                  animation: visible
                    ? 'gali-eye-sequence 2s ease-in-out 0.7s both'
                    : 'none',
                }}
              />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
