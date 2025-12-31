// components/input/SearchInput.tsx
import React from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface SearchInputProps extends TextInputProps {
    label?: string;
    containerStyle?: ViewStyle;
}

const ORANGE = "#f59e0b";

const SearchInput: React.FC<SearchInputProps> = ({
    label = "SEARCH",
    containerStyle,
    ...textInputProps
}) => {
    return (
        <View style={containerStyle}>
            {/* LABEL */}
            <Text style={styles.label}>{label}</Text>

            {/* INPUT SHELL */}
            <View style={styles.inputWrapper}>
                <Ionicons
                    name="search-outline"
                    size={16}
                    color="#fbbf24" // soft orange circle
                    style={styles.icon}
                />
                <TextInput
                    style={styles.input}
                    placeholderTextColor={ORANGE}
                    {...textInputProps}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 12,
        fontFamily: "Karla-ExtraBold",
        letterSpacing: 1,
        color: "#000000ff",
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#fde68a",
        backgroundColor: "#ffffff",
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,

    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 12,
        fontFamily: "Karla-Regular",
        color: "#000000ff",
        paddingVertical: 0,
    },
});

export default SearchInput;
