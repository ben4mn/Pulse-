import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  show: boolean;
  children: ReactNode;
  onExited?: () => void;
}

export function ViewTransition({ show, children, onExited }: Props) {
  const [mounted, setMounted] = useState(show);
  const [animating, setAnimating] = useState<'enter' | 'exit' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => setAnimating('enter'));
    } else if (mounted) {
      setAnimating('exit');
      const timer = setTimeout(() => {
        setMounted(false);
        setAnimating(null);
        onExited?.();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [show, mounted, onExited]);

  if (!mounted) return null;

  return (
    <div
      ref={ref}
      className={`fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto ${
        animating === 'enter' ? 'view-enter' : animating === 'exit' ? 'view-exit' : ''
      }`}
    >
      {children}
    </div>
  );
}
