'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/input/Input';
import Select from '@/components/input/SelectInput';
import FormField from '@/components/input/FormField';
import ValidatedButton from '@/components/button/ValidatedButton';
import { FieldDef } from '@/app/types/index';
import { useDynamicFields } from '@/components/generic/useDynamicFields';

export interface DynamicFormProps<T> {
  title?: string;
  fields: FieldDef<T>[];
  initialData?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  dynamicOptionsUpdater?: (fields: FieldDef<T>[], valuesMap: Record<string, any>) => void;
  className?: string;
  onFieldChange?: (key: keyof T, value: any) => void; // ✅ NEW
}

export default function DynamicForm<T = any>({
  title,
  fields: initialFields,
  initialData,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  onCancel,
  dynamicOptionsUpdater,
  className = '',
  onFieldChange,
}: DynamicFormProps<T>) {
  const router = useRouter();
  const { fields, setFields, handleFieldChange, setDynamicOptionsUpdater } = useDynamicFields<T>(initialFields);

  // Apply dynamic option updater on mount if provided
  useEffect(() => {
    if (dynamicOptionsUpdater) {
      setDynamicOptionsUpdater(dynamicOptionsUpdater);
    }
  }, [dynamicOptionsUpdater, setDynamicOptionsUpdater]);

  // Pre-fill fields when editing
  useEffect(() => {
    if (!initialData) return;
    setFields(prev =>
      prev.map(f => {
        const k = String(f.key) as keyof T;
        if (Object.prototype.hasOwnProperty.call(initialData, k)) {
          return { ...f, value: (initialData as any)[k] };
        }
        return f;
      })
    );
  }, [initialData, setFields]);

  // Prepare fields for validation (ValidatedButton)
  const validatedFields = fields.map(f => ({
    name: f.label,
    value: f.value,
    validationRules: f.validationRules,
    hidden: f.hidden,
    disabled: f.disabled,
  }));

  // Handle final form submission
  const handleValidSubmit = async () => {
    const data = Object.fromEntries(fields.map(f => [String(f.key), f.value])) as unknown as T;
    await onSubmit(data);
  };

  return (
    <div
      className={`max-w-3xl mx-auto shadow-sm rounded-2xl p-8 space-y-8 ${className}`}
      style={{
        backgroundColor: 'var(--form-body-bg)',
        color: 'var(--form-text-color)',
      }}
    >
      {title && (
        <h1
          style={{ color: 'var(--form-text-color)' }}
          className="text-2xl font-bold"
        >
          {title}
        </h1>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(f =>
          f.hidden ? null : (
            <FormField
              key={String(f.key)}
              label={f.label}
              htmlFor={String(f.key)}
              required={!!f.validationRules?.required}
            >
              {f.options ? (
                <Select
                  id={String(f.key)}
                  label={f.label}
                  value={f.value}
                  options={f.options.map(o => ({ ...o, value: String(o.value) }))}
                  disabled={f.disabled}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    handleFieldChange(f.key, e.target.value);
                    onFieldChange?.(f.key, e.target.value);
                  }}
                  style={{
                    backgroundColor: 'var(--form-body-bg)',
                    color: 'var(--form-text-color)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              ) : (
                <Input
                  id={String(f.key)}
                  type={
                    String(f.key).toLowerCase().includes('password')
                      ? 'password'
                      : typeof f.value === 'number'
                      ? 'number'
                      : 'text'
                  }
                  value={f.value ?? ''}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                  disabled={f.disabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newValue =
                      e.target.type === 'number'
                        ? e.target.value === ''
                          ? ''
                          : Number(e.target.value)
                        : e.target.value;
                    handleFieldChange(f.key, newValue);
                    onFieldChange?.(f.key, newValue);
                  }}
                  style={{
                    backgroundColor: 'var(--form-body-bg)',
                    color: 'var(--form-text-color)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              )}
            </FormField>
          )
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <ValidatedButton
            variant="primary"
            fields={validatedFields}
            onValidSubmit={handleValidSubmit}
        >
          {submitText}
        </ValidatedButton>

        <ValidatedButton
            variant="orange"
            fields={[]}
            onValidSubmit={() => {
                if (onCancel) onCancel();
                else router.back();
            }}
            >
            {cancelText}
        </ValidatedButton>
      </div>
    </div>
  );
}
