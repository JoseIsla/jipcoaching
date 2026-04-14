import { useState, useRef, useCallback, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Loader2 } from "lucide-react";

const THRESHOLD = 70;
const MAX_PULL = 100;

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}

const PullToRefresh = ({ children, onRefresh }: PullToRefreshProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const indicatorOpacity = useTransform(pullY, [0, 30, THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullY, [0, THRESHOLD], [0.6, 1]);
  const indicatorRotation = useTransform(pullY, [0, THRESHOLD, MAX_PULL], [0, 180, 270]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.closest("main")?.scrollTop ?? 0;
    if (scrollTop <= 0 && !refreshing) {
      isDragging.current = true;
      startY.current = e.touches[0].clientY;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    const dampened = Math.min(MAX_PULL, delta * 0.45);
    pullY.set(dampened);
  }, [pullY]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullY.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      animate(pullY, 50, { duration: 0.2 });

      if (onRefresh) {
        await onRefresh();
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }

      setRefreshing(false);
    }

    animate(pullY, 0, { duration: 0.3, ease: "easeOut" });
  }, [pullY, refreshing, onRefresh]);


  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center -top-2 z-10 pointer-events-none"
        style={{ opacity: indicatorOpacity, y: pullY }}
      >
        <motion.div
          className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center backdrop-blur-sm"
          style={{ scale: indicatorScale }}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ rotate: indicatorRotation }}
            >
              <path d="M12 5v14M5 12l7-7 7 7" />
            </motion.svg>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
