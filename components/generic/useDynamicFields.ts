// utils/useDynamicFields.ts

import { useState } from 'react';
import { FieldDef } from '@/app/types/index';

export function useDynamicFields<T = any>(initialFields: FieldDef<T>[]) {
  const [fields, setFields] = useState<FieldDef<T>[]>(initialFields);

  let dynamicOptionsUpdater: ((fields: FieldDef<T>[], valuesMap: Record<string, any>) => void) | null = null;

  const setDynamicOptionsUpdater = (fn: typeof dynamicOptionsUpdater) => {
    dynamicOptionsUpdater = fn;
  };

  const handleFieldChange = (key: keyof T, value: any) => {
    setFields(prev => {
      const newFields = prev.map(f => (f.key === key ? { ...f, value } : f));
      const valuesMap = Object.fromEntries(newFields.map(f => [f.key, f.value]));

      // Apply dependsOn conditions and calculations
      newFields.forEach(f => {
        if (f.dependsOn) {
          // condition determines hidden/disabled
          if (f.dependsOn.condition) {
            const result = f.dependsOn.condition(valuesMap);
            f.hidden = result;
            f.disabled = result;
          }
          // calculate overrides value
          if (f.dependsOn.calculate) {
            f.value = f.dependsOn.calculate(valuesMap);
          }
        }
      });

      // Apply page-specific dynamic options
      if (dynamicOptionsUpdater) dynamicOptionsUpdater(newFields, valuesMap);

      return newFields;
    });
  };

  return { fields, setFields, handleFieldChange, setDynamicOptionsUpdater };
}