// components/modal/GeneralModal.tsx
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type GeneralModalVariant = "default" | "danger";

type Props = {
  open: boolean;

  title?: string;
  message?: string;

  // If you want custom body (forms, extra text, etc.)
  children?: React.ReactNode;

  // Footer
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void; // called when user closes modal (backdrop / close button / cancel)
  hideCancel?: boolean;
  hideConfirm?: boolean;

  confirmDisabled?: boolean;
  confirmLoading?: boolean;

  // Behavior
  closeOnBackdropPress?: boolean;
  showCloseX?: boolean;

  variant?: GeneralModalVariant;

  // Styling hooks
  cardStyle?: ViewStyle;
  bodyStyle?: ViewStyle;

  // Replace the entire footer if needed
  footer?: React.ReactNode;
};

export default function GeneralModal({
  open,
  title,
  message,
  children,

  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  onClose,

  hideCancel,
  hideConfirm,

  confirmDisabled,
  confirmLoading,

  closeOnBackdropPress = true,
  showCloseX = false,

  variant = "default",

  cardStyle,
  bodyStyle,
  footer,
}: Props) {
  const handleClose = () => {
    onCancel?.();
    onClose?.();
  };

  const handleBackdropPress = () => {
    if (!closeOnBackdropPress) return;
    handleClose();
  };

  const confirmBtnStyle =
    variant === "danger" ? styles.confirmBtnDanger : styles.confirmBtn;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleBackdropPress}
        style={styles.backdrop}
      >
        {/* Stop propagation */}
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.cardWrap}>
          <View style={[styles.card, cardStyle]}>
            {(title || showCloseX) && (
              <View style={styles.headerRow}>
                <Text style={styles.title} numberOfLines={2}>
                  {title || ""}
                </Text>

                {showCloseX ? (
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.9}
                    style={styles.closeBtn}
                    disabled={confirmLoading}
                  >
                    <Text style={styles.closeText}>×</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <ScrollView
              style={[styles.body, bodyStyle]}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {message ? <Text style={styles.message}>{message}</Text> : null}
              {children}
            </ScrollView>

            {footer ? (
              <View style={styles.footerRow}>{footer}</View>
            ) : (
              <View style={styles.footerRow}>
                {!hideCancel ? (
                  <TouchableOpacity
                    style={[styles.cancelBtn, confirmLoading && { opacity: 0.7 }]}
                    onPress={handleClose}
                    activeOpacity={0.9}
                    disabled={confirmLoading}
                  >
                    <Text style={styles.cancelText}>{cancelLabel}</Text>
                  </TouchableOpacity>
                ) : null}

                {!hideConfirm ? (
                  <TouchableOpacity
                    style={[
                      confirmBtnStyle,
                      (confirmDisabled || confirmLoading) && { opacity: 0.7 },
                    ]}
                    onPress={onConfirm}
                    activeOpacity={0.9}
                    disabled={!!confirmDisabled || !!confirmLoading}
                  >
                    {confirmLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.confirmText}>{confirmLabel}</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cardWrap: { width: "100%", maxWidth: 420 },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  headerRow: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: {
    flex: 1,
    paddingRight: 10,
    fontFamily: "Karla-ExtraBold",
    fontSize: 14,
    color: "#111827",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  closeText: { fontSize: 22, lineHeight: 22, color: "#111827" },

  body: { maxHeight: 280 },
  bodyContent: { padding: 14, paddingBottom: 8 },
  message: {
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#2e2f31",
    lineHeight: 18,
    marginBottom: 10,
  },

  footerRow: {
    padding: 14,
    paddingTop: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },

  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  cancelText: {
    fontFamily: "Karla-Bold",
    fontSize: 13,
    color: "#374151",
  },

  confirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EE9328",
  },
  confirmBtnDanger: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
  },
  confirmText: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 13,
    color: "#ffffff",
  },
});
