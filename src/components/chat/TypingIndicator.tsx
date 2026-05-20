import GaliAvatar from './GaliAvatar';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="flex-shrink-0">
        <GaliAvatar size={32} pending />
      </div>
      <div className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-text-muted/40 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-text-muted/40 rounded-full animate-bounce-dot" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-text-muted/40 rounded-full animate-bounce-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
