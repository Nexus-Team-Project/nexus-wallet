import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface SlideHowDidYouArriveProps {
  onDirect: () => void;
  onOrg: () => void;
}

export function SlideHowDidYouArrive({ onDirect, onOrg }: SlideHowDidYouArriveProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<'direct' | 'org' | null>(null);

  const options = [
    {
      id: 'direct' as const,
      emoji: '🚀',
      title: t.authFlow.howArriveDirectTitle,
      desc: t.authFlow.howArriveDirectDesc,
      color: 'from-orange-400 to-pink-500',
    },
    {
      id: 'org' as const,
      emoji: '🏢',
      title: t.authFlow.howArriveOrgTitle,
      desc: t.authFlow.howArriveOrgDesc,
      color: 'from-primary to-blue-400',
    },
  ];

  const handleSelect = (id: 'direct' | 'org') => {
    setSelected(id);
    setTimeout(() => {
      if (id === 'direct') onDirect();
      else onOrg();
    }, 320);
  };

  return (
    <div className="absolute inset-0 bg-white flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-20 pb-6">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
          {t.authFlow.howArriveSubtitle}
        </p>
        <h1 className="text-2xl font-extrabold text-text-primary leading-tight">
          {t.authFlow.howArriveTitle}
        </h1>
      </div>

      {/* Option cards */}
      <div className="flex-1 flex flex-col px-5 gap-4 pb-10">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={(e) => { e.stopPropagation(); handleSelect(opt.id); }}
              className="w-full text-right"
            >
              <div
                className={`rounded-3xl p-5 border-2 transition-all duration-200 flex items-center gap-4 ${
                  isSelected
                    ? 'border-primary bg-primary/5 scale-[0.98]'
                    : 'border-border bg-white hover:border-primary/30 hover:bg-surface'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${opt.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span style={{ fontSize: '28px' }}>{opt.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary text-base mb-0.5 leading-snug">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">{opt.desc}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}>
                  {isSelected && (
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
