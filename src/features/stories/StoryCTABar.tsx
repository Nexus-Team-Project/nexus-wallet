import type React from 'react';
import type { StoryStep } from './types';

interface StoryCTABarProps {
  isOrgFlow: boolean;
  steps: StoryStep[];
  setSteps: React.Dispatch<React.SetStateAction<StoryStep[]>>;
  setDirection: React.Dispatch<React.SetStateAction<1 | -1>>;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  goTo: (index: number) => void;
  orgColor: string;
  /** Called when the primary "קליק להמשך" button is tapped in new-user flow */
  onNewUserContinue: () => void;
  /** When provided, shows a "continue with another organization" text link
      under the primary CTA that opens the tenant-join discovery sheet. */
  onJoinOtherOrg?: () => void;
}

export function StoryCTABar({
  isOrgFlow,
  steps,
  goTo,
  orgColor,
  onNewUserContinue,
  onJoinOtherOrg,
}: StoryCTABarProps) {
  return (
    <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
      {/* Gradient fade */}
      <div className="h-24 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="bg-black/70 backdrop-blur-sm px-6 pb-6 pt-1 pointer-events-auto" dir="rtl">
        {/* Primary CTA. The "רוצה להתחבר עם ארגון אחר?" secondary link
            was removed - the post-login routing in lib/postLogin.ts is
            now the single place where users switch context, and exposing
            a duplicate switch from inside the story chain confused
            first-time users. */}
        <div className="flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isOrgFlow) {
                // Jump to the terminal interactive slide: match-screen for an
                // org member, or join-prompt for a non-member of ?tenant=X.
                const targetIdx = steps.findIndex(s => s.id === 'match-screen' || s.id === 'join-prompt');
                if (targetIdx !== -1) goTo(targetIdx);
              } else {
                onNewUserContinue();
              }
            }}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
            style={{
              background: 'rgba(255,255,255,0.95)',
              color: orgColor,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'wght' 700" }}>chevron_left</span>
            קליק להמשך
          </button>
        </div>

        {/* Secondary: continue with another organization → opens the
            tenant-join discovery sheet. Plain white text, bottom-right (RTL). */}
        {onJoinOtherOrg && (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onJoinOtherOrg(); }}
              className="text-white/90 text-xs font-medium active:scale-95"
            >
              רוצה להמשיך עם ארגון אחר? <span className="underline underline-offset-2">לחץ כאן</span>
            </button>
          </div>
        )}

        {/* Powered by Nexus — org flow only */}
        {isOrgFlow && (
          <div className="flex items-center justify-center mt-3 opacity-70">
            <img src="/nexus-logo-animated-white.gif" alt="Nexus" style={{ height: 22, width: 'auto', marginRight: 3 }} />
            <span className="text-white text-[11px] font-medium">powered by</span>
          </div>
        )}
      </div>
    </div>
  );
}
