// components/input/SelectInput.tsx

'use client';

import { forwardRef, useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react-native';


interface ValidationRules {
  required?: boolean;
  custom?: (value: string) => string | null;
}

type UISize = 'sm' | 'md' | 'lg';

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  validationRules?: ValidationRules;
  showValidation?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValidationChange?: (isValid: boolean, error: string | null) => void;
  options?: { label: string; value: string }[];
  uiSize?: UISize;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error: externalError,
      helperText,
      validationRules,
      showValidation = true,
      className = '',
      onChange,
      onValidationChange,
      value = '',
      options,
      uiSize = 'md',
      ...props
    },
    ref
  ) => {
    const [internalError, setInternalError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const error = externalError || internalError;
    const showError = touched && error && showValidation;
    const showSuccess =
      touched && !error && validationRules && value && showValidation;

    const sizeClasses: Record<UISize, string> = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const validateValue = (inputValue: string): string | null => {
      if (!validationRules) return null;
      const { required, custom } = validationRules;
      if (required && (!inputValue || inputValue.trim() === '')) {
        return 'This field is required';
      }
      if (!inputValue || inputValue.trim() === '') return null;
      if (custom) return custom(inputValue);
      return null;
    };

    useEffect(() => {
      if (!validationRules || !touched) return;
      const validationError = validateValue(String(value));
      setInternalError((prev) =>
        prev !== validationError ? validationError : prev
      );
      const valid = !validationError;
      setIsValid((prev) => (prev !== valid ? valid : prev));
      if (onValidationChange) onValidationChange(valid, validationError);
    }, [value, touched]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) onChange(e);
      if (!touched) setTouched(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setTouched(true);
      if (props.onBlur) props.onBlur(e);
    };

    const getValidationIcon = () => {
      if (!showValidation || !validationRules) return null;
      if (showError) return <AlertCircle className="w-5 h-5 text-[var(--formfield-error)]" />;
      if (showSuccess) return <CheckCircle className="w-5 h-5 text-green-500" />; // success can stay green or map to a --success-color if you add it
      return null;
    };

    const selectClasses = `
      block w-full rounded-lg shadow-sm transition-colors
      focus:outline-none focus:ring-2 focus:ring-[var(--link-color)]
      bg-[var(--form-body-bg)] text-[var(--form-text-color)]
      border
      ${sizeClasses[uiSize]}
      ${
        showError
          ? 'border-[var(--formfield-error)]'
          : showSuccess
          ? 'border-green-400'
          : 'border-[var(--border-color)]'
      }
      ${className}
    `.trim();

    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            className={selectClasses}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
          >
            <option value="" disabled>
              -- Select {label} --
            </option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {getValidationIcon()}
          </div>
        </div>

        {showError && (
          <p className="mt-1 text-sm flex items-center text-[var(--formfield-error)]">
            <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
            {error}
          </p>
        )}

        {helperText && !showError && (
          <p className="mt-1 text-sm text-[var(--formfield-helper)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
