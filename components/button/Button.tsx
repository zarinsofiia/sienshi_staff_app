// components/button/Button.tsx (React Native)
import React, { forwardRef } from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonRounded,
  ButtonShadow,
  spinnerColors,
} from "./ButtonConfig";

const Button = forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ButtonProps
>(
  (
    {
      children,
      onPress,
      variant = "primary",
      size = "md",
      disabled = false,
      loading = false,
      fullWidth = false,
      color,
      bgColor,
      icon: Icon,
      iconPosition = "left",
      iconSize = 16,
      iconColor,
      spinnerPosition = "left",
      loadingText,
      rounded = "lg",
      shadow = "none",
      active = false,
      style,
      textStyle,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    /* --------------------------- size config (RN) --------------------------- */
    const sizeStyles: Record<
      ButtonSize,
      { paddingVertical: number; paddingHorizontal: number; fontSize: number }
    > = {
      sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13 },
      md: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
      lg: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 16 },
    };

    /* -------------------------- variant config (RN) ------------------------- */
    const variantStyles: Record<
      ButtonVariant,
      { backgroundColor: string; textColor: string; borderColor?: string }
    > = {
      primary: { backgroundColor: "#2563eb", textColor: "#ffffff" },
      secondary: { backgroundColor: "#4b5563", textColor: "#ffffff" },
      outline: {
        backgroundColor: "transparent",
        textColor: "#374151",
        borderColor: "#d1d5db",
      },
      danger: { backgroundColor: "#dc2626", textColor: "#ffffff" },
      ghost: { backgroundColor: "transparent", textColor: "#374151" },
      subtle: { backgroundColor: "#f3f4f6", textColor: "#111827" },
      warning: { backgroundColor: "#eab308", textColor: "#111827" },
      success: { backgroundColor: "#16a34a", textColor: "#ffffff" },
      info: { backgroundColor: "#0ea5e9", textColor: "#ffffff" },
      indigo: { backgroundColor: "#4f46e5", textColor: "#ffffff" },
      purple: { backgroundColor: "#7c3aed", textColor: "#ffffff" },
      pink: { backgroundColor: "#ec4899", textColor: "#ffffff" },
      orange: { backgroundColor: "#f97316", textColor: "#ffffff" },
      teal: { backgroundColor: "#14b8a6", textColor: "#ffffff" },
      dark: { backgroundColor: "#000000", textColor: "#ffffff" },
      light: {
        backgroundColor: "#ffffff",
        textColor: "#111827",
        borderColor: "#d1d5db",
      },
      gradientBlue: { backgroundColor: "#2563eb", textColor: "#ffffff" },
      gradientGreen: { backgroundColor: "#16a34a", textColor: "#ffffff" },
      gradientPurple: { backgroundColor: "#7c3aed", textColor: "#ffffff" },
      gradientSunset: { backgroundColor: "#ec4899", textColor: "#ffffff" },
      outlineBlue: {
        backgroundColor: "transparent",
        textColor: "#2563eb",
        borderColor: "#2563eb",
      },
      outlineGreen: {
        backgroundColor: "transparent",
        textColor: "#16a34a",
        borderColor: "#16a34a",
      },
      outlineRed: {
        backgroundColor: "transparent",
        textColor: "#dc2626",
        borderColor: "#dc2626",
      },
      outlinePurple: {
        backgroundColor: "transparent",
        textColor: "#7c3aed",
        borderColor: "#7c3aed",
      },
    };

    const roundedStyles: Record<ButtonRounded, number> = {
      none: 0,
      sm: 4,
      md: 8,
      lg: 10,
      full: 9999,
    };

    const shadowStyles: Record<ButtonShadow, ViewStyle> = {
      none: {},
      sm: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
      },
      lg: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 4,
      },
    };

    const sizeConfig = sizeStyles[size];
    const variantConfig =
      variantStyles[variant] ?? variantStyles["primary"];

    const backgroundColor = bgColor ?? variantConfig.backgroundColor;
    const textColor = color ?? variantConfig.textColor;

    const containerStyles: StyleProp<ViewStyle> = [
      styles.base,
      {
        paddingVertical: sizeConfig.paddingVertical,
        paddingHorizontal: sizeConfig.paddingHorizontal,
        backgroundColor,
        borderRadius: roundedStyles[rounded],
        opacity: isDisabled ? 0.6 : 1,
      },
      variantConfig.borderColor && {
        borderWidth: 1,
        borderColor: variantConfig.borderColor,
      },
      fullWidth && { alignSelf: "stretch" },
      active && styles.activeBorder,
      shadowStyles[shadow],
      style,
    ];

    const textStyles: StyleProp<TextStyle> = [
      styles.text,
      { color: textColor, fontSize: sizeConfig.fontSize },
      textStyle,
    ];

    const handlePress = (e: any) => {
      if (isDisabled) return;
      onPress?.(e);
    };

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.75}
        disabled={isDisabled}
        onPress={handlePress}
        style={containerStyles}
        {...rest}
      >
        <View style={styles.contentRow}>
          {/* Left spinner */}
          {loading && spinnerPosition === "left" && (
            <ActivityIndicator
              size={size === "sm" ? "small" : "small"}
              color={color ?? spinnerColors[variant] ?? "#ffffff"}
              style={styles.spinnerLeft}
            />
          )}

          {/* Left icon */}
          {!loading && Icon && iconPosition === "left" && (
            <Icon
              size={iconSize}
              color={iconColor ?? color ?? textColor}
            />
          )}

          {/* Text */}
          <Text style={textStyles} numberOfLines={1}>
            {loading ? loadingText || children : children}
          </Text>

          {/* Right spinner */}
          {loading && spinnerPosition === "right" && (
            <ActivityIndicator
              size={size === "sm" ? "small" : "small"}
              color={color ?? spinnerColors[variant] ?? "#ffffff"}
              style={styles.spinnerRight}
            />
          )}

          {/* Right icon */}
          {!loading && Icon && iconPosition === "right" && (
            <Icon
              size={iconSize}
              color={iconColor ?? color ?? textColor}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6, // RN 0.71+ supports gap; if not, replace with margins
  },
  text: {
    fontWeight: "600",
  },
  spinnerLeft: {
    marginRight: 6,
  },
  spinnerRight: {
    marginLeft: 6,
  },
  activeBorder: {
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
});

export default Button;
