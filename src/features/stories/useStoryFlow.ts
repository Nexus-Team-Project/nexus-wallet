import { useState, useCallback, useEffect, useRef } from 'react';
import type React from 'react';
import type { StoryStep } from './types';

const STORY_DURATION = 6000; // ms default per auto-advance story

interface UseStoryFlowOptions {
  initialSteps: StoryStep[];
  imagesLoaded: boolean;
}

export interface UseStoryFlowReturn {
  steps: StoryStep[];
  setSteps: React.Dispatch<React.SetStateAction<StoryStep[]>>;
  current: number;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  direction: 1 | -1;
  setDirection: React.Dispatch<React.SetStateAction<1 | -1>>;
  progress: number;
  goTo: (index: number, forceDirection?: 1 | -1) => void;
  goNext: () => void;
  goPrev: () => void;
  handleTap: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function useStoryFlow({ initialSteps, imagesLoaded }: UseStoryFlowOptions): UseStoryFlowReturn {
  const [steps, setSteps] = useState<StoryStep[]>(initialSteps);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  const goTo = useCallback(
    (index: number, forceDirection?: 1 | -1) => {
      if (index < 0 || index >= steps.length) return;
      setDirection(forceDirection ?? (index > current ? 1 : -1));
      setCurrent(index);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    [current, steps.length]
  );

  const goNext = useCallback(() => {
    const next = current + 1;
    // Interactive steps (e.g. match-screen) are ONLY reachable via the CTA button.
    // Tap and auto-advance loop back to slide 0 instead of landing on them.
    if (next >= steps.length || steps[next]?.interactive) {
      goTo(0);
      return;
    }
    goTo(next);
  }, [current, steps, goTo]);

  const goPrev = useCallback(() => {
    if (current === 0) return;
    goTo(current - 1);
  }, [current, steps.length, goTo]);

  // Auto-advance timer — disabled on interactive slides and while images are loading
  const isInteractive = steps[current]?.interactive ?? false;
  const currentDuration = steps[current]?.duration ?? STORY_DURATION;

  useEffect(() => {
    if (isInteractive || !imagesLoaded) {
      setProgress(isInteractive ? 1 : 0);
      return;
    }

    startTimeRef.current = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / currentDuration, 1);
      setProgress(p);
      if (p >= 1) {
        goNext();
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, isInteractive, imagesLoaded, goNext, currentDuration]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (steps[current]?.interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) goPrev();
    else goNext();
  };

  return {
    steps, setSteps,
    current, setCurrent,
    direction, setDirection,
    progress,
    goTo, goNext, goPrev,
    handleTap,
  };
}
