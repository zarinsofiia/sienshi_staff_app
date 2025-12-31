// components/input/FormField.tsx
import { ReactNode } from 'react';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  children: ReactNode;
}

export default function FormField({
  label,
  htmlFor,
  required,
  error,
  helperText,
  children,
}: FormFieldProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text)' }}
        >
          {label}
          {required && (
            <span className="ml-1" style={{ color: 'red' }}>
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <span
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="mt-1 text-sm flex items-center"
          style={{ color: 'var(--danger)' }}
        >
          {error}
        </span>
      ) : helperText ? (
        <span
          className="mt-1 text-sm"
          style={{ color: 'var(--popover-bg)' }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
