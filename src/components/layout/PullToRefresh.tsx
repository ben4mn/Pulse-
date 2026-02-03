import { useRef, useCallback, useEffect, type ReactNode } from 'react';

const THRESHOLD = 110;
const MAX_PULL = 160;
const RESISTANCE = 0.4;

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const pulling = useRef(false);
  const refreshing = useRef(false);
  const startY = useRef(0);

  const resetVisuals = useCallback(() => {
    const container = containerRef.current;
    const spinner = spinnerRef.current;
    if (!container || !spinner) return;

    container.style.transform = '';
    container.style.transition = 'transform 0.3s ease';
    spinner.style.transform = 'translateY(-100%) scale(0.3)';
    spinner.style.opacity = '0';
    spinner.classList.remove('ptr-refreshing');

    setTimeout(() => {
      container.style.transition = '';
    }, 300);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (refreshing.current) return;
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (refreshing.current) return;
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 0) return;

    const dy = e.touches[0].clientY - startY.current;
    if (dy < 30) return;

    pulling.current = true;
    const currentPull = Math.min(dy * RESISTANCE, MAX_PULL);
    const progress = Math.min(currentPull / (THRESHOLD * RESISTANCE), 1);

    const container = containerRef.current;
    const spinner = spinnerRef.current;
    if (!container || !spinner) return;

    container.style.transform = `translateY(${currentPull}px)`;
    spinner.style.transform = `translateY(${currentPull - 44}px) scale(${0.3 + progress * 0.7})`;
    spinner.style.opacity = String(Math.min(progress * 1.5, 1));

    if (progress >= 1) {
      spinner.classList.add('ptr-threshold');
    } else {
      spinner.classList.remove('ptr-threshold');
    }

    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing.current) return;
    pulling.current = false;

    const container = containerRef.current;
    const spinner = spinnerRef.current;
    if (!container || !spinner) return;

    const currentTransform = container.style.transform;
    const match = currentTransform.match(/translateY\(([0-9.]+)px\)/);
    const currentPull = match ? parseFloat(match[1]) : 0;

    if (currentPull >= THRESHOLD * RESISTANCE) {
      // Trigger refresh
      refreshing.current = true;
      container.style.transition = 'transform 0.2s ease';
      container.style.transform = 'translateY(50px)';
      spinner.style.transform = 'translateY(6px) scale(1)';
      spinner.classList.add('ptr-refreshing');

      try {
        await onRefresh();
      } finally {
        refreshing.current = false;
        resetVisuals();
      }
    } else {
      resetVisuals();
    }
  }, [onRefresh, resetVisuals]);

  useEffect(() => {
    const el = containerRef.current?.parentElement ?? document;
    el.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    el.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    el.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart as EventListener);
      el.removeEventListener('touchmove', handleTouchMove as EventListener);
      el.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className="relative overflow-hidden">
      {/* Spinner */}
      <div
        ref={spinnerRef}
        className="ptr-spinner absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg"
        style={{ transform: 'translateY(-100%) scale(0.3)', opacity: 0 }}
      >
        <div className="ptr-loader w-5 h-5 border-2 border-pulse border-t-transparent rounded-full" />
        <div className="ptr-glow absolute inset-0 rounded-full bg-pulse/20" style={{ opacity: 0 }} />
      </div>

      {/* Content */}
      <div ref={containerRef}>
        {children}
      </div>
    </div>
  );
}
