// components/button/CustomButton.tsx
import React from "react";
import Button from "./Button";
import { ButtonProps } from "./ButtonConfig";

// add new preset name in the union
type CustomPreset = "view" | "print" | "approve" | "danger" | "success" | "info";

export interface CustomButtonProps
    extends Omit<ButtonProps, "variant" | "bgColor" | "color"> {
    preset?: CustomPreset;
}

/**
 * Small pill-style button used in list cards (View / Approve / Print).
 */
const CustomButton: React.FC<CustomButtonProps> = ({
    preset = "view",
    style,
    textStyle,
    children,
    ...rest
}) => {
    let bgColor = "#ffffff";
    let textColor = "#111827";
    let borderColor: string | undefined;

    switch (preset) {
        case "view":
            bgColor = "#fefce8"; // soft yellow
            textColor = "#111827";
            borderColor = "#facc15";
            break;
        case "approve":
            bgColor = "#36cc6dab";      // soft green background
            textColor = "#04160b";      // dark green text
            borderColor = "#16a34a";    // medium green border
            break;

        case "print":
            bgColor = "#f59e0b";
            textColor = "#ffffff";
            borderColor = "#f59e0b";
            break;
        case "danger":
            bgColor = "#fee2e2"; // light red
            textColor = "#b91c1c";
            borderColor = "#ef4444";
            break;
        case "success":
            bgColor = "#dcfce7"; // light green
            textColor = "#166534";
            borderColor = "#22c55e";
            break;
        case "info":                        // 👈 new preset
            bgColor = "#77e6ff3f";
            textColor = "#0f172a";            // dark text for contrast
            borderColor = "#77E6FF";
            break;

    }

    return (
        <Button
            size="sm"
            rounded="full"
            shadow="none"
            bgColor={bgColor}
            color={textColor}
            style={[
                {
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 999,
                    borderWidth: borderColor ? 1 : 0,
                    borderColor: borderColor,
                    minWidth: 80,
                },
                style,
            ]}
            textStyle={[
                {
                    fontSize: 14,
                    fontFamily: "Karla-Bold",
                },
                textStyle,
            ]}
            {...rest}
        >
            {children}
        </Button>
    );
};

export default CustomButton;
