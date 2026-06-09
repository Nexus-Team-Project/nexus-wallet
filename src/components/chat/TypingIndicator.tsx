import GaliAvatar from './GaliAvatar';

const SLIDE_MS = 350;

export default function TypingIndicator() {
  return (
    // flex-row-reverse matches the AI ChatMessage layout so the avatar sits on
    // the AI side of the chat (left in he-IL, right in en-IL). The avatar
    // slides down into place, then the dot bubble fades in.
    <div
      className="flex items-center gap-3 px-5 py-3 flex-row-reverse animate-avatar-slide-down"
    >
      <div className="flex-shrink-0">
        <GaliAvatar size={32} pending />
      </div>
      <div
        className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
        style={{
          opacity: 0,
          animation: `fade-in 0.25s ease-out ${SLIDE_MS}ms forwards`,
        }}
      >
        <span
          className="w-2 h-2 bg-text-muted/40 rounded-full animate-bounce-dot"
          style={{ animationDelay: `${SLIDE_MS}ms` }}
        />
        <span
          className="w-2 h-2 bg-text-muted/40 rounded-full animate-bounce-dot"
          style={{ animationDelay: `${SLIDE_MS + 150}ms` }}
        />
        <span
          className="w-2 h-2 bg-text-muted/40 rounded-full animate-bounce-dot"
          style={{ animationDelay: `${SLIDE_MS + 300}ms` }}
        />
      </div>
    </div>
  );
}
