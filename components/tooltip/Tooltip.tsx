'use client';
import { ReactNode, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
  hideDelay?: number;
  maxWidth?: string;
  maxHeight?: string;
}

export default function Tooltip({
  content,
  children,
  className = '',
  delay = 300,
  hideDelay = 100, // short delay to prevent disappearing on small gaps
  maxWidth = '350px',
  maxHeight = '200px',
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (!visible) {
      showTimeoutRef.current = setTimeout(() => setVisible(true), delay);
    }
  };

  const hideTooltip = () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setVisible(false), hideDelay);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!spanRef.current) return;
    const el = spanRef.current;

    const isOverflowing = el.scrollWidth > el.offsetWidth;
    if (!isOverflowing) return setVisible(false);

    const rect = el.getBoundingClientRect();

    setTooltipStyle({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX + rect.width / 2,
    });

    showTooltip();
  };

  return (
    <>
      <span
        ref={spanRef}
        className="block overflow-hidden text-ellipsis"
        style={{ display: 'block', whiteSpace: 'nowrap', maxWidth: '100%' }}
        onMouseEnter={showTooltip}
        onMouseMove={handleMouseMove}
        onMouseLeave={hideTooltip}
      >
        {children}
      </span>

      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`
              text-sm rounded shadow-lg
              bg-[var(--popover-bg)]     /* 👈 theme-aware background */
              text-[var(--popover-text)]         /* 👈 theme-aware text color */
              border border-[var(--border-color)]
              ${className}
            `}
            style={{
              position: 'absolute',
              top: tooltipStyle.top,
              left: tooltipStyle.left,
              maxWidth,
              maxHeight,
              overflowY: 'auto',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              padding: '8px 12px',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
