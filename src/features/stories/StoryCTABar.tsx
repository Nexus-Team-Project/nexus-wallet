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
  onSwitchUser: () => void;
  onChangeOrg: () => void;
  /** Called when the primary "קליק להמשך" button is tapped in new-user flow */
  onNewUserContinue: () => void;
}

export function StoryCTABar({
  isOrgFlow,
  steps,
  goTo,
  orgColor,
  onSwitchUser,
  onChangeOrg,
  onNewUserContinue,
}: StoryCTABarProps) {
  return (
    <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
      {/* Gradient fade */}
      <div className="h-24 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="bg-black/70 backdrop-blur-sm px-6 pb-6 pt-1 pointer-events-auto" dir="rtl">
        <div className="flex items-center gap-4">

          {/* Secondary links */}
          <div className="flex-1 flex flex-col gap-2 text-right">
            <button
              onClick={(e) => { e.stopPropagation(); onChangeOrg(); }}
              className="text-right active:opacity-70 transition-opacity"
            >
              <p className="text-white/75 text-xs leading-snug">רוצה להתחבר עם ארגון אחר?</p>
              <span className="text-white text-xs font-bold border-b border-white/60 pb-px">הכניסה מכאן</span>
            </button>
            {isOrgFlow && (
              <button
                onClick={(e) => { e.stopPropagation(); onSwitchUser(); }}
                className="text-right active:opacity-70 transition-opacity"
              >
                <p className="text-white/75 text-xs leading-snug">רוצה להתחבר עם משתמש אחר?</p>
                <span className="text-white text-xs font-bold border-b border-white/60 pb-px">הכניסה מכאן</span>
              </button>
            )}
          </div>

          {/* Primary CTA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isOrgFlow) {
                const matchIdx = steps.findIndex(s => s.id === 'match-screen');
                if (matchIdx !== -1) goTo(matchIdx);
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
