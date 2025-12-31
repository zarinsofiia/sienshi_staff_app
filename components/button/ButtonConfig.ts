// components/button/ButtonConfig.ts (React Native version)
import { ReactNode } from "react";
import {
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

/* -------------------------------------------------------------------------- */
/*                                  TYPESETS                                  */
/* -------------------------------------------------------------------------- */

/** Button style variants (keep same union as web) */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost"
  | "subtle"
  | "warning"
  | "success"
  | "info"
  | "indigo"
  | "purple"
  | "pink"
  | "orange"
  | "teal"
  | "dark"
  | "light"
  | "gradientBlue"
  | "gradientGreen"
  | "gradientPurple"
  | "gradientSunset"
  | "outlineBlue"
  | "outlineGreen"
  | "outlineRed"
  | "outlinePurple";

/** Button size presets */
export type ButtonSize = "sm" | "md" | "lg";

/** Corner radius presets */
export type ButtonRounded = "none" | "sm" | "md" | "lg" | "full";

/** Shadow depth presets */
export type ButtonShadow = "none" | "sm" | "md" | "lg";

/* -------------------------------------------------------------------------- */
/*                                  PROPS                                     */
/* -------------------------------------------------------------------------- */

export interface ButtonProps extends TouchableOpacityProps {
  /** Button text or inner elements */
  children?: ReactNode;

  /** onPress handler (React Native) */
  onPress?: (event: GestureResponderEvent) => void;

  /** Visual variant style */
  variant?: ButtonVariant;

  /** Size (padding & font size) */
  size?: ButtonSize;

  /** Disabled state */
  disabled?: boolean;

  /** Loading spinner active */
  loading?: boolean;

  /** Optional loading text (replaces children) */
  loadingText?: string;

  /** Spinner position relative to text */
  spinnerPosition?: "left" | "right";

  /** Full width layout */
  fullWidth?: boolean;

  /** Color overrides for text / icon / background */
  color?: string;
  bgColor?: string;

  /** Icon component and position */
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  iconPosition?: "left" | "right";
  iconSize?: number;
  iconColor?: string;

  /** Rounded corner style */
  rounded?: ButtonRounded;

  /** Shadow depth */
  shadow?: ButtonShadow;

  /** Active state (e.g. add ring/border) */
  active?: boolean;

  /** Container style override */
  style?: StyleProp<ViewStyle>;

  /** Text style override */
  textStyle?: StyleProp<TextStyle>;
}

/* -------------------------------------------------------------------------- */
/*                               STYLE CONSTANTS                              */
/* -------------------------------------------------------------------------- */
/**
 * In React Native we don't use Tailwind class strings.
 * We'll keep only simple color mappings that the Button component can use.
 */

/** Spinner colors per variant (still useful) */
export const spinnerColors: Record<ButtonVariant, string> = {
  primary: "white",
  secondary: "white",
  outline: "gray",
  ghost: "gray",
  subtle: "gray",
  danger: "white",
  warning: "white",
  success: "white",
  info: "white",
  indigo: "white",
  purple: "white",
  pink: "white",
  orange: "white",
  teal: "white",
  dark: "white",
  light: "gray",
  gradientBlue: "white",
  gradientGreen: "white",
  gradientPurple: "white",
  gradientSunset: "white",
  outlineBlue: "blue",
  outlineGreen: "green",
  outlineRed: "red",
  outlinePurple: "purple",
};
