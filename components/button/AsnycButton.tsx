// components/button/AsyncButton.tsx (React Native)
import React, { useState } from "react";
import { Alert } from "react-native";
import Button from "./Button";
import { ButtonProps } from "./ButtonConfig";

export interface AsyncButtonProps
  extends Omit<ButtonProps, "onPress" | "loading"> {
  /** Function to run on press (can be async or sync) */
  onPress: () => void | Promise<void>;

  /** Optional toast/alert messages */
  successMessage?: string;
  errorMessage?: string;

  /** Disable automatic alerts */
  disableToast?: boolean;
}

const AsyncButton: React.FC<AsyncButtonProps> = ({
  onPress,
  children,
  successMessage,
  errorMessage,
  disableToast = false,
  ...rest
}) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await onPress();

      if (!disableToast && successMessage) {
        Alert.alert("Success", successMessage);
      }
    } catch (err) {
      console.error(err);
      if (!disableToast) {
        Alert.alert("Error", errorMessage || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button loading={loading} onPress={handlePress} {...rest}>
      {children}
    </Button>
  );
};

export default AsyncButton;
