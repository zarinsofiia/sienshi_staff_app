// components/input/Input.tsx (React Native version - style fix)
import { AlertCircle, CheckCircle } from 'lucide-react-native';
import React, { forwardRef, useEffect, useState } from 'react';
import {
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

interface ValidationRules {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: string) => string | null;
}

type UISize = 'sm' | 'md' | 'lg';

interface InputProps
  extends Omit<
    TextInputProps,
    'onChange' | 'onChangeText' | 'value' | 'style'
  > {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  validationRules?: ValidationRules;
  showValidation?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  onValidationChange?: (isValid: boolean, error: string | null) => void;
  uiSize?: UISize;

  /** Style for the outer container (View) */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style for the inner TextInput */
  inputStyle?: StyleProp<TextStyle>;

  labelStyle?: StyleProp<TextStyle>;
  trimEnd?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error: externalError,
      helperText,
      leftIcon,
      rightIcon,
      validationRules,
      showValidation = true,
      uiSize = 'md',
      value = '',
      onChangeText,
      onValidationChange,
      containerStyle,
      inputStyle,
      labelStyle,
      onBlur,
      editable = true,
      trimEnd = false,
      ...rest
    },
    ref
  ) => {
    const [internalError, setInternalError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const error = externalError || internalError;
    const showError = touched && !!error && showValidation;
    const showSuccess =
      touched && !error && !!validationRules && !!value && showValidation;

    const sizeConfig: Record<
      UISize,
      { paddingVertical: number; paddingHorizontal: number; fontSize: number }
    > = {
      sm: { paddingVertical: 6, paddingHorizontal: 8, fontSize: 14 },
      md: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 16 },
      lg: { paddingVertical: 10, paddingHorizontal: 14, fontSize: 18 },
    };

    const validateValue = (inputValue: string): string | null => {
      if (!validationRules) return null;

      const {
        required,
        email,
        minLength,
        maxLength,
        pattern,
        min,
        max,
        custom,
      } = validationRules;

      const trimmed = inputValue?.trim?.() ?? '';

      if (required && (!trimmed || trimmed === '')) {
        return 'This field is required';
      }
      if (!trimmed) return null;

      if (
        email &&
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(trimmed)
      ) {
        return 'Please enter a valid email address';
      }
      if (minLength && trimmed.length < minLength) {
        return `Must be at least ${minLength} characters long`;
      }
      if (maxLength && trimmed.length > maxLength) {
        return `Must not exceed ${maxLength} characters`;
      }
      if (pattern && !pattern.test(trimmed)) {
        return 'Invalid format';
      }

      if (min !== undefined || max !== undefined) {
        const numValue = Number(trimmed);
        if (!Number.isNaN(numValue)) {
          if (min !== undefined && numValue < min) {
            return `Must be at least ${min}`;
          }
          if (max !== undefined && numValue > max) {
            return `Must not exceed ${max}`;
          }
        }
      }

      if (custom) {
        return custom(trimmed);
      }

      return null;
    };

    useEffect(() => {
      if (!validationRules || !touched) return;

      const validationError = validateValue(String(value ?? ''));
      setInternalError(validationError ?? null);

      const valid = !validationError;
      setIsValid(valid);
      if (onValidationChange) {
        onValidationChange(valid, validationError);
      }
    }, [value, touched, validationRules, onValidationChange]);

     const handleChangeText = (text: string) => {
      const next = trimEnd ? text.replace(/\s+$/g, '') : text;
      onChangeText?.(next);
    };

    const handleBlur: TextInputProps['onBlur'] = (e) => {
      setTouched(true);
      onBlur?.(e);
    };


    const getValidationIcon = () => {
      if (!showValidation || !validationRules) return null;
      if (showError) {
        return <AlertCircle size={18} color="#ef4444" />;
      }
      if (showSuccess) {
        return <CheckCircle size={18} color="#22c55e" />;
      }
      return null;
    };

    const borderColor = showError
      ? '#fecaca'
      : showSuccess
        ? '#bbf7d0'
        : '#4b5563';

    const sizeStyles = sizeConfig[uiSize];

    return (
      <View style={styles.container}>
        {label ? (
          <Text style={[styles.label, labelStyle]}>
            {label}
            {validationRules?.required && (
              <Text style={styles.requiredMark}> *</Text>
            )}
          </Text>
        ) : null}

        <View
          style={[
            styles.inputWrapper,
            {
              borderColor,
              backgroundColor: editable ? '#111827' : '#1f2933',
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
            },
            (showError || showSuccess) && styles.inputWrapperElevated,
            containerStyle,
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            value={value}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            editable={editable}
            placeholderTextColor="#6b7280"
            style={[
              styles.input,
              { fontSize: sizeStyles.fontSize },
              leftIcon ? styles.inputWithLeftIcon : undefined,
              (rightIcon || getValidationIcon())
                ? styles.inputWithRightIcon
                : undefined,
              inputStyle,
            ]}
            {...rest}
          />

          {(rightIcon || getValidationIcon()) && (
            <View style={styles.iconRight}>
              {rightIcon || getValidationIcon()}
            </View>
          )}
        </View>

        {showError && (
          <View style={styles.helperRow}>
            <AlertCircle size={14} color="#dc2626" style={styles.helperIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {helperText && !showError && (
          <Text style={styles.helperText}>{helperText}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  requiredMark: {
    color: '#ef4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  inputWrapperElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 0.12,
  },
  input: {
    flex: 1,
    color: '#f9fafb',
    paddingVertical: 0,
  },
  inputWithLeftIcon: {
    marginLeft: 6,
  },
  inputWithRightIcon: {
    marginRight: 6,
  },
  iconLeft: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  helperIcon: {
    marginRight: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
  },
  helperText: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
  },
});

export default Input;
