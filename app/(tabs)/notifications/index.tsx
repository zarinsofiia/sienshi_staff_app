// app/(tabs)/notifications/index.tsx
import React, { useMemo, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader } from "../../../components/AppHeader";
import BasicCard from "../../../components/card/BasicCard";

// ✅ swipe
import { Swipeable } from "react-native-gesture-handler";

const ORANGE = "#EE9328";

type NotiKind = "info" | "success" | "warning" | "error";

type NotiItem = {
    id: string;
    title: string;
    message: string;
    createdAt: string; // display only (hardcoded)
    read: boolean;
    kind: NotiKind;
};

const HARD_NOTIFICATIONS: NotiItem[] = [
    {
        id: "n1",
        title: "Stock In completed",
        message: "Stock-in SI-2026-00012 has been completed.",
        createdAt: "2026-02-05 09:12",
        read: false,
        kind: "success",
    },
    {
        id: "n2",
        title: "New parcels received",
        message: "8 new parcels were stocked in at Location A-12.",
        createdAt: "2026-02-05 08:40",
        read: false,
        kind: "info",
    },
    {
        id: "n3",
        title: "Pickup completed",
        message: "Pickup completed for customer K/0007 (3 parcels).",
        createdAt: "2026-02-04 18:05",
        read: true,
        kind: "success",
    },
    {
        id: "n4",
        title: "Action required",
        message: "Some parcels are still unassigned to location.",
        createdAt: "2026-02-04 16:22",
        read: true,
        kind: "warning",
    },
];

export default function NotificationsScreen() {
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [items, setItems] = useState<NotiItem[]>(HARD_NOTIFICATIONS);

    // ✅ detail modal state
    const [detailOpen, setDetailOpen] = useState(false);
    const [activeNotiId, setActiveNotiId] = useState<string | null>(null);

    const unreadCount = useMemo(
        () => items.filter((x) => !x.read).length,
        [items]
    );

    const shown = useMemo(() => {
        if (filter === "unread") return items.filter((x) => !x.read);
        return items;
    }, [items, filter]);

    const activeNoti = useMemo(() => {
        if (!activeNotiId) return null;
        return items.find((x) => x.id === activeNotiId) ?? null;
    }, [activeNotiId, items]);

    // ✅ Keep track of the currently-open swipe row
    const openRowRef = useRef<Swipeable | null>(null);

    const closeOpenRow = () => {
        openRowRef.current?.close();
        openRowRef.current = null;
    };

    const openDetail = (id: string) => {
        closeOpenRow();

        // ✅ auto mark as read
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));

        setActiveNotiId(id);
        setDetailOpen(true);
    };


    const closeDetail = () => {
        setDetailOpen(false);
        setActiveNotiId(null);
    };

    const toggleRead = (id: string) => {
        setItems((prev) =>
            prev.map((x) => (x.id === id ? { ...x, read: !x.read } : x))
        );
    };

    const markAsRead = (id: string) => {
        setItems((prev) =>
            prev.map((x) => (x.id === id ? { ...x, read: true } : x))
        );
    };

    const markAllRead = () => {
        closeOpenRow();
        setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    };

    const deleteNoti = (id: string) => {
        closeOpenRow();
        setItems((prev) => prev.filter((x) => x.id !== id));
        if (activeNotiId === id) closeDetail();
    };

    const getKindIcon = (kind: NotiKind) => {
        switch (kind) {
            case "success":
                return { name: "checkmark-circle-outline" as const, color: "#16a34a" };
            case "warning":
                return { name: "warning-outline" as const, color: "#d97706" };
            case "error":
                return { name: "close-circle-outline" as const, color: "#dc2626" };
            default:
                return { name: "information-circle-outline" as const, color: "#2563eb" };
        }
    };

    const renderRightActions = (n: NotiItem) => {
        return (
            <View style={styles.rightActionWrap}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => deleteNoti(n.id)}
                    style={styles.deleteBtn}
                >
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <AppHeader title="NOTIFICATIONS" showBack backTo="/dashboard" />

            <View style={styles.content}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <BasicCard style={styles.card}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerLeft}>
                                <View style={styles.headerIconBubble}>
                                    <Ionicons
                                        name="notifications-outline"
                                        size={16}
                                        color="#111827"
                                    />
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
                                    <Text style={styles.headerSub}>{unreadCount} unread</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={markAllRead}
                                style={styles.markAllBtn}
                            >
                                <Ionicons
                                    name="checkmark-done-outline"
                                    size={16}
                                    color={ORANGE}
                                />
                                <Text style={styles.markAllText}>Mark all read</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.filterRow}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setFilter("all")}
                                style={[
                                    styles.filterPill,
                                    filter === "all" && styles.filterPillActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        filter === "all" && styles.filterTextActive,
                                    ]}
                                >
                                    All
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setFilter("unread")}
                                style={[
                                    styles.filterPill,
                                    filter === "unread" && styles.filterPillActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        filter === "unread" && styles.filterTextActive,
                                    ]}
                                >
                                    Unread
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </BasicCard>

                    <BasicCard style={styles.card}>
                        {shown.length === 0 ? (
                            <Text style={styles.emptyText}>No notifications</Text>
                        ) : (
                            shown.map((n) => {
                                const icon = getKindIcon(n.kind);

                                return (
                                    <Swipeable
                                        key={n.id}
                                        renderRightActions={() => renderRightActions(n)}
                                        rightThreshold={40}
                                        overshootRight={false}
                                        onSwipeableWillOpen={() => {
                                            if (openRowRef.current) openRowRef.current.close();
                                        }}
                                        onSwipeableOpen={(direction, swipeable) => {
                                            openRowRef.current = swipeable;
                                        }}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => openDetail(n.id)}
                                            onLongPress={() => toggleRead(n.id)}
                                            delayLongPress={250}
                                            style={[styles.itemRow, !n.read && styles.itemRowUnread]}
                                        >
                                            <View style={styles.itemLeft}>
                                                <View style={styles.kindIconWrap}>
                                                    <Ionicons
                                                        name={icon.name}
                                                        size={18}
                                                        color={icon.color}
                                                    />
                                                </View>

                                                <View style={{ flex: 1 }}>
                                                    <View style={styles.itemTopRow}>
                                                        <Text style={styles.itemTitle}>{n.title}</Text>
                                                        {!n.read ? <View style={styles.unreadDot} /> : null}
                                                    </View>

                                                    <Text style={styles.itemMessage}>{n.message}</Text>

                                                    <Text style={styles.itemTime}>{n.createdAt}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </Swipeable>
                                );
                            })
                        )}
                    </BasicCard>
                </ScrollView>
            </View>

            {/* ✅ Detail Modal */}
            <Modal
                visible={detailOpen}
                transparent
                animationType="fade"
                onRequestClose={closeDetail}
            >
                <Pressable style={styles.modalBackdrop} onPress={closeDetail}>
                    <Pressable style={styles.modalCard} onPress={() => { }}>
                        {activeNoti ? (
                            <>
                                <View style={styles.modalHeaderRow}>
                                    <Text style={styles.modalTitle}>{activeNoti.title}</Text>
                                    <TouchableOpacity
                                        onPress={closeDetail}
                                        style={styles.modalCloseBtn}
                                    >
                                        <Ionicons name="close" size={18} color="#111827" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.modalTime}>{activeNoti.createdAt}</Text>

                                <Text style={styles.modalMessage}>{activeNoti.message}</Text>

                                <View style={styles.modalActionsRow}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            toggleRead(activeNoti.id);
                                            closeDetail();
                                        }}
                                        style={styles.modalActionPill}
                                    >
                                        <Ionicons
                                            name={
                                                activeNoti.read
                                                    ? "mail-unread-outline"
                                                    : "mail-open-outline"
                                            }
                                            size={16}
                                            color={ORANGE}
                                        />
                                        <Text style={styles.modalActionText}>
                                            {activeNoti.read ? "Mark Unread" : "Mark Read"}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            markAsRead(activeNoti.id);
                                            closeDetail();
                                        }}
                                        style={[styles.modalActionPill, styles.modalPrimaryPill]}
                                    >
                                        <Text
                                            style={[styles.modalActionText, styles.modalPrimaryText]}
                                        >
                                            OK
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.emptyText}>No notification</Text>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#ffffff" },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
    scrollContent: { paddingBottom: 24 },

    card: { marginBottom: 14 },

    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    headerIconBubble: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: "#fff7ed",
        borderWidth: 1,
        borderColor: "#fed7aa",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontFamily: "Karla-ExtraBold",
        fontSize: 15,
        letterSpacing: 1,
        color: "#111827",
    },
    headerSub: {
        marginTop: 2,
        fontFamily: "Karla-Regular",
        fontSize: 13,
        color: "#6b7280",
    },

    markAllBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#fed7aa",
        backgroundColor: "#fff7ed",
    },
    markAllText: {
        fontFamily: "Karla-ExtraBold",
        fontSize: 13,
        color: "#9a3412",
    },

    filterRow: { flexDirection: "row", gap: 10 },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#ffffff",
    },
    filterPillActive: { borderColor: ORANGE, backgroundColor: "#fff7ed" },
    filterText: { fontFamily: "Karla-Bold", fontSize: 14, color: "#2e2f31" },
    filterTextActive: { color: ORANGE },

    emptyText: {
        fontFamily: "Karla-Regular",
        fontSize: 13,
        color: "#9ca3af",
        marginTop: 4,
    },

    itemRow: {
        borderWidth: 1,
        borderColor: "#f3f4f6",
        backgroundColor: "#ffffff",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 10,
    },
    itemRowUnread: {
        borderColor: "#fed7aa",
        backgroundColor: "#fff7ed",
    },
    itemLeft: { flexDirection: "row", gap: 10 },
    kindIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 12,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    itemTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    itemTitle: {
        flex: 1,
        fontFamily: "Karla-ExtraBold",
        fontSize: 14,
        color: "#111827",
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: ORANGE,
    },
    itemMessage: {
        marginTop: 4,
        fontFamily: "Karla-Regular",
        fontSize: 13,
        color: "#2e2f31",
    },
    itemTime: {
        marginTop: 8,
        fontFamily: "Karla-Regular",
        fontSize: 12,
        color: "#6b7280",
    },

    // ✅ swipe delete action
    rightActionWrap: {
        width: 110,
        marginBottom: 10,
        marginLeft: 10,
        justifyContent: "center",
    },
    deleteBtn: {
        flex: 1,
        backgroundColor: "#dc2626",
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingHorizontal: 10,
    },
    deleteText: {
        fontFamily: "Karla-ExtraBold",
        fontSize: 12,
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },

    // ✅ detail modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        padding: 16,
        justifyContent: "center",
    },
    modalCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "#f3f4f6",
    },
    modalHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    modalTitle: {
        flex: 1,
        fontFamily: "Karla-ExtraBold",
        fontSize: 15,
        color: "#111827",
    },
    modalCloseBtn: {
        width: 34,
        height: 34,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
    },
    modalTime: {
        marginTop: 6,
        fontFamily: "Karla-Regular",
        fontSize: 12,
        color: "#6b7280",
    },
    modalMessage: {
        marginTop: 10,
        fontFamily: "Karla-Regular",
        fontSize: 14,
        color: "#111827",
        lineHeight: 20,
    },
    modalActionsRow: {
        marginTop: 14,
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },
    modalActionPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#fed7aa",
        backgroundColor: "#fff7ed",
    },
    modalActionText: {
        fontFamily: "Karla-ExtraBold",
        fontSize: 13,
        color: "#9a3412",
    },
    modalPrimaryPill: {
        backgroundColor: ORANGE,
        borderColor: ORANGE,
    },
    modalPrimaryText: {
        color: "#ffffff",
    },
});
