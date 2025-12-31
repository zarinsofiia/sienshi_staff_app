'use client';
import { useEffect, useRef } from 'react';

type Activity = {
  id: number | string;
  title: string;
  time: string;
};

interface BulletListWithTimestampProps {
  activities: Activity[];
  maxItems?: number;      // number of visible items
  scrollable?: boolean;   // enable auto-scroll
  showScrollbar?: boolean; // show scrollbar or not
  scrollSpeed?: number;    // pixels per interval, default 1
  interval?: number;       // interval in ms for scrolling step
}

export default function BulletListWithTimestamp({
  activities,
  maxItems = 5,
  scrollable = true,
  showScrollbar = false,
  scrollSpeed = 1,
  interval = 30,
}: BulletListWithTimestampProps) {
  const visibleActivities = activities.slice(0, maxItems);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollable || !containerRef.current) return;

    const container = containerRef.current;
    let scrollPosition = 0;

    const step = () => {
      if (!container) return;
      scrollPosition += scrollSpeed;

      if (scrollPosition >= container.scrollHeight) {
        scrollPosition = 0; // loop back to top
      }
      container.scrollTop = scrollPosition;
    };

    const timer = setInterval(step, interval);
    return () => clearInterval(timer);
  }, [scrollable, scrollSpeed, interval]);

  return (
    <div
      className="
        bg-[var(--card-bg)]
        text-[var(--card-text)]
        border border-[var(--border-color)]
        rounded-lg shadow p-6
      "
    >
      <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>

      <div
        ref={containerRef}
        className={`space-y-3 ${scrollable ? 'overflow-y-auto' : ''}`}
        style={{
          maxHeight: scrollable ? `${maxItems * 60}px` : undefined,
          scrollbarWidth: showScrollbar ? undefined : 'none', // Firefox
        }}
      >
        {visibleActivities.map((activity) => (
          <div
            key={activity.id}
            // className="
            //   flex items-center space-x-3 p-3
            //   bg-[var(--muted-bg)]
            //   rounded-lg
            //   border border-[var(--border-color)]
            // "
            className="
              flex items-center space-x-3 p-3
              bg-[var(--muted-bg)]
              rounded-lg
            "
          >
            <div className="w-2 h-2 rounded-full bg-[var(--primary-color)]"></div>
            <div>
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-xs text-[var(--muted-text)]">{activity.time}</p>
            </div>
          </div>
        ))}

        {/* Hide scrollbar for Webkit (Chrome, Safari) if showScrollbar = false */}
        {!showScrollbar && (
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        )}
      </div>
    </div>
  );
}