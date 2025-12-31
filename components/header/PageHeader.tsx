// app/components/ui/PageHeader.tsx
import { ReactNode } from 'react';

interface PageHeaderProps {
  /** Main heading text or JSX */
  children: ReactNode;
  /** Optional sub-title text */
  subtitle?: ReactNode;
  /** Optional icon on the left side */
  icon?: ReactNode;
  /** Extra class names if you need spacing overrides */
  className?: string;
}

export default function PageHeader({
  children,
  subtitle,
  icon,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`mb-6 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && (
          <span className="flex-shrink-0 text-[var(--text)]">
            {icon}
          </span>
        )}
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text)' }}
        >
          {children}
        </h1>
      </div>

      {subtitle && (
        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--muted-text)' }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}