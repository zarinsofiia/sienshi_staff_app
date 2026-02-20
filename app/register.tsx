// app/register.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../contexts/LanguageContext";

const ORANGE = "#f59e0b";

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");

    const { t, lang, setLang } = useLanguage();

    const handleRegister = () => {
        // TODO: call your register API later
        console.log("Register pressed");
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.container}>
                    {/* Top orange header */}
                    <View style={styles.header}>
                        <Text style={styles.headerText}>{t("register_title")}</Text>
                    </View>

                    {/* White rounded panel */}
                    <View style={styles.panel}>
                        <ScrollView
                            contentContainerStyle={styles.panelContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* USERNAME */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>
                                    {t("register_username_label")}
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="person-outline"
                                        size={16}
                                        color="#9ca3af"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t("register_username_placeholder")}
                                        placeholderTextColor="#9ca3af"
                                        autoCapitalize="none"
                                        value={username}
                                        onChangeText={setUsername}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            {/* PHONE */}
                            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                                <Text style={styles.label}>
                                    {t("register_phone_label")}
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="call-outline" size={16} color="#9ca3af" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t("register_phone_placeholder")}
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={setPhone}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            {/* PASSWORD */}
                            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                                <Text style={styles.label}>
                                    {t("register_password_label")}
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={16}
                                        color="#9ca3af"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t("register_password_placeholder")}
                                        placeholderTextColor="#9ca3af"
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            {/* CONFIRM PASSWORD */}
                            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                                <Text style={styles.label}>
                                    {t("register_confirm_password_label")}
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={16}
                                        color="#9ca3af"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t("register_confirm_password_placeholder")}
                                        placeholderTextColor="#9ca3af"
                                        secureTextEntry
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            {/* EMAIL */}
                            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                                <Text style={styles.label}>
                                    {t("register_email_label")}
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="mail-outline"
                                        size={16}
                                        color="#9ca3af"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t("register_email_placeholder")}
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                        returnKeyType="done"
                                    />
                                </View>
                            </View>

                            {/* REGISTER BUTTON */}
                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={handleRegister}
                            >
                                <Text style={styles.registerButtonText}>
                                    {t("register_button")}
                                </Text>
                            </TouchableOpacity>

                            {/* Already have account */}
                            <View style={styles.loginRow}>
                                <Text style={styles.loginText}>
                                    {t("register_have_account")}{" "}
                                </Text>
                                <TouchableOpacity onPress={() => router.replace("/login")}>
                                    <Text style={styles.loginLink}>
                                        {t("register_login")}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Language toggle */}
                            <View style={styles.langRow}>
                                <TouchableOpacity onPress={() => setLang("en")}>
                                    <Text
                                        style={[
                                            styles.langText,
                                            lang === "en" && styles.langActive,
                                        ]}
                                    >
                                        EN
                                    </Text>
                                </TouchableOpacity>

                                <Text style={styles.langSeparator}> | </Text>

                                <TouchableOpacity onPress={() => setLang("zh")}>
                                    <Text
                                        style={[
                                            styles.langText,
                                            lang === "zh" && styles.langActive,
                                        ]}
                                    >
                                        中
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    container: {
        flex: 1,
        backgroundColor: ORANGE,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 30,
    },
    headerText: {
        fontSize: 28,
        fontFamily: "Karla-ExtraBold",
        fontWeight: "900",
        color: "#ffffff",
    },
    panel: {
        flex: 1,
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        marginTop: 45,
        overflow: "hidden",
    },
    panelContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },
    fieldGroup: {
        marginTop: 0,
    },
    label: {
        fontSize: 14,
        fontFamily: "Karla-ExtraBold",
                fontWeight: "900",

        color: ORANGE,
        letterSpacing: 0.8,
        marginTop: 15,
    },
    inputWrapper: {
        marginTop: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#f9fafb",
        paddingHorizontal: 12,
        paddingVertical: 2,
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        flex: 1,
        height: 40,
        fontSize: 14,
        color: "#111827",
        marginLeft: 8,
    },
    registerButton: {
        marginTop: 28,
        backgroundColor: ORANGE,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
    },
    registerButtonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 14,
        letterSpacing: 0.8,
    },
    loginRow: {
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    loginText: {
        fontSize: 11,
        color: "#6b7280",
    },
    loginLink: {
        fontSize: 11,
        color: ORANGE,
        fontWeight: "700",
    },
    langRow: {
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    langText: {
        fontSize: 13,
        color: "#9ca3af",
        fontFamily: "Karla-ExtraBold",
    },
    langActive: {
        color: ORANGE,
        fontFamily: "Karla-ExtraBold",
    },
    langSeparator: {
        fontSize: 13,
        color: "#9ca3af",
        marginHorizontal: 6,
    },
});
