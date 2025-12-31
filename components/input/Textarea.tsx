// app/components/ui/Input.tsx
import { forwardRef, useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

type UISize = 'sm' | 'md' | 'lg';

interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  validationRules?: ValidationRules;
  showValidation?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onValidationChange?: (isValid: boolean, error: string | null) => void;
  uiSize?: UISize;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
	{
	  label,
	  error: externalError,
	  helperText,
	  leftIcon,
	  rightIcon,
	  validationRules,
	  showValidation = true,
	  className = '',
	  onChange,
	  onValidationChange,
	  value = '',
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
	  const { required, minLength, maxLength, pattern, custom } =
		validationRules;

	  if (required && (!inputValue || inputValue.trim() === '')) {
		return 'This field is required';
	  }
	  if (!inputValue || inputValue.trim() === '') return null;

	  if (minLength && inputValue.length < minLength) {
		return `Must be at least ${minLength} characters long`;
	  }
	  if (maxLength && inputValue.length > maxLength) {
		return `Must not exceed ${maxLength} characters`;
	  }
	  if (pattern && !pattern.test(inputValue)) {
		return 'Invalid format';
	  }
	  if (custom) return custom(inputValue);
	  return null;
	};

	useEffect(() => {
	  if (!validationRules || !touched) return;
	  const validationError = validateValue(String(value));
	  setInternalError(validationError ?? null);
	  const valid = !validationError;
	  setIsValid(valid);
	  if (onValidationChange) onValidationChange(valid, validationError);
	}, [value, touched]);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
	  onChange?.(e);
	  if (!touched) setTouched(true);
	};

	const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
	  setTouched(true);
	  props.onBlur?.(e);
	};

	const getValidationIcon = () => {
	  if (!showValidation || !validationRules) return null;
	  if (showError) return <AlertCircle className="w-5 h-5 text-red-500" />;
	  if (showSuccess) return <CheckCircle className="w-5 h-5 text-green-500" />;
	  return null;
	};

	const textareaClasses = `
	  block w-full rounded-lg shadow-sm transition-colors
	  placeholder-[color:var(--formfield-placeholder)]
	  bg-[color:var(--formfield-bg)]
	  text-[color:var(--formfield-text)]
	  border
	  focus:outline-none focus:ring-2 focus:ring-[color:var(--formfield-focus)] focus:border-transparent
	  disabled:bg-[color:var(--formfield-disabled-bg)] disabled:text-[color:var(--formfield-disabled-text)] disabled:cursor-not-allowed
	  ${sizeClasses[uiSize]}
	  ${showError
		? 'border-red-400 focus:ring-red-500'
		: showSuccess
		  ? 'border-green-400 focus:ring-green-500'
		  : 'border-[color:var(--formfield-border)]'}
	  ${leftIcon ? 'pl-10' : ''}
	  ${(rightIcon || getValidationIcon()) ? 'pr-10' : ''}
	  ${className}
	`.trim();

	return (
	  <div className="w-full">
		{label && (
		  <label className="block text-sm font-medium text-[color:var(--form-text-color)] mb-1">
			{label}
			{validationRules?.required && (
			  <span className="text-red-500 ml-1">*</span>
			)}
		  </label>
		)}

		<div className="relative">
		  {leftIcon && (
			<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
			  {leftIcon}
			</div>
		  )}

		  <textarea
			ref={ref}
			className={textareaClasses}
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
			{...props}
		  />

		  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
			{rightIcon || getValidationIcon()}
		  </div>
		</div>

		{showError && (
		  <p className="mt-1 text-sm text-red-600 flex items-center">
			<AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
			{error}
		  </p>
		)}

		{helperText && !showError && (
		  <p className="mt-1 text-sm text-[color:var(--form-text-caption)]">
			{helperText}
		  </p>
		)}
	  </div>
	);
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
