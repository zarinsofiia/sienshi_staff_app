// components/button/ValidatedButton.tsx (React Native)
import React, { ReactNode, useState } from "react";
import { Alert } from "react-native";
import Button from "./Button";
import { ButtonProps } from "./ButtonConfig";

interface Field {
  name: string;
  value: any;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    email?: boolean;
  };
  hidden?: boolean;
  disabled?: boolean;
}

interface ValidatedButtonProps
  extends Pick<ButtonProps, "variant" | "size" | "fullWidth" | "style" | "textStyle" | "disabled" | "shadow" | "rounded" | "color" | "bgColor" | "icon" | "iconPosition" | "iconSize" | "iconColor" | "spinnerPosition" | "loadingText" | "active"> {
  children: ReactNode;
  fields: Field[];
  onValidSubmit: () => void | Promise<void>;
}

const ValidatedButton: React.FC<ValidatedButtonProps> = ({
  children,
  fields,
  onValidSubmit,
  variant = "primary",
  size = "md",
  fullWidth = false,
  style,
  textStyle,
  ...rest
}) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;

    const errors: string[] = [];

    // Validate only visible & enabled fields
    const visibleFields = fields.filter((f) => !f.hidden && !f.disabled);

    visibleFields.forEach((f) => {
      const val = f.value;
      const rules = f.validationRules;
      if (!rules) return;

      const strVal = val != null ? String(val) : "";

      if (rules.required && (!strVal || strVal.trim() === "")) {
        errors.push(`${f.name} is required`);
      }
      if (rules.minLength && strVal.length < rules.minLength) {
        errors.push(
          `${f.name} must be at least ${rules.minLength} characters`
        );
      }
      if (rules.email && !/^\S+@\S+\.\S+$/.test(strVal)) {
        errors.push(`${f.name} must be a valid email`);
      }
    });

    if (errors.length > 0) {
      // Simple alert for now — you can swap this to a toast library later
      Alert.alert(
        "Validation error",
        errors.join("\n")
      );
      return;
    }

    setLoading(true);
    try {
      await onValidSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      style={style}
      textStyle={textStyle}
      loading={loading}
      onPress={handlePress}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default ValidatedButton;
