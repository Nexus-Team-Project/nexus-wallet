interface BarSegment {
  key: string;
  isDone: boolean;
  isActive: boolean;
}

interface StoryProgressBarProps {
  segments: BarSegment[];
  progress: number;
}

export function StoryProgressBar({ segments, progress }: StoryProgressBarProps) {
  return (
    <div className="flex gap-1">
      {segments.map(({ key, isDone, isActive }) => (
        <div
          key={key}
          className="flex-1 h-[3px] rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
        >
          <div
            className="h-full rounded-full bg-white"
            style={{
              width: isDone ? '100%' : isActive ? `${progress * 100}%` : '0%',
            }}
          />
        </div>
      ))}
    </div>
  );
}
