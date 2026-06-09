import { useChatStore } from '../../stores/chatStore';

interface ChatTestPanelProps {
  language: 'he' | 'en';
}

// Resets cleared by toggling — wiping the dismissed/position storage
// lets the user re-test the drag-to-trash flow without DevTools.
const STORAGE_KEYS = [
  'nexus-chat-fab-ai-pos',
  'nexus-chat-fab-ai-dismissed-v1',
  'nexus-chat-fab-human-pos',
  'nexus-chat-fab-human-dismissed-v1',
];

export default function ChatTestPanel({ language }: ChatTestPanelProps) {
  const isHumanChatActive = useChatStore((s) => s.isHumanChatActive);
  const agentTyping = useChatStore((s) => s.agentTyping);
  const aiTyping = useChatStore((s) => s.aiTyping);
  const setHumanChatActive = useChatStore((s) => s.setHumanChatActive);
  const setAgentTyping = useChatStore((s) => s.setAgentTyping);
  const setAiTyping = useChatStore((s) => s.setAiTyping);

  const reset = () => {
    for (const key of STORAGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    // The FABs read storage on mount only — a reload picks up the wipe.
    window.location.reload();
  };

  const rows: { label: string; checked: boolean; onChange: (v: boolean) => void; desc: string }[] = [
    {
      label: language === 'he' ? 'צ\'אט עם נציג פעיל' : 'Human-agent chat active',
      desc: language === 'he'
        ? 'מציג את כפתור הצ\'אט עם נקודת ON-LINE ירוקה.'
        : 'Mounts the human FAB with the green online dot.',
      checked: isHumanChatActive,
      onChange: setHumanChatActive,
    },
    {
      label: language === 'he' ? 'נציג מקליד' : 'Agent typing',
      desc: language === 'he'
        ? 'הנקודות בתוך הכפתור של הנציג קופצות במחזור.'
        : 'Three dots inside the human FAB bounce in sequence.',
      checked: agentTyping,
      onChange: setAgentTyping,
    },
    {
      label: language === 'he' ? 'AI חושב' : 'AI thinking',
      desc: language === 'he'
        ? 'הנקודות בכפתור ה-AI קופצות בזמן עיבוד.'
        : 'Three dots inside the AI FAB bounce while processing.',
      checked: aiTyping,
      onChange: setAiTyping,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rows.map((row) => (
          <label
            key={row.label}
            className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-border hover:bg-surface active:scale-[0.99] transition-all cursor-pointer"
          >
            <input
              type="checkbox"
              checked={row.checked}
              onChange={(e) => row.onChange(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-primary cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{row.label}</p>
              <p className="text-[11px] text-text-muted leading-snug">{row.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={reset}
        className="w-full py-3 rounded-2xl bg-surface text-text-secondary font-semibold text-sm border border-border active:scale-[0.98] transition-transform"
      >
        {language === 'he' ? 'איפוס מיקומים + השלכות' : 'Reset positions & dismissals'}
      </button>
    </div>
  );
}
