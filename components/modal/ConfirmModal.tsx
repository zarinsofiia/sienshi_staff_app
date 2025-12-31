// components/modal/ConfirmModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import CustomButton from "../button/CustomButton";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  // kept for backwards compatibility, but no longer rendered as a button
  cancelLabel?: string;
  /** Optional label + handler for a third "Reject" button */
  rejectLabel?: string;
  onConfirm: () => void;
  onCancel: () => void; // still used for backdrop / Android back / X button
  onReject?: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel", // not rendered, just kept so existing calls compile
  rejectLabel = "Reject",
  onConfirm,
  onCancel,
  onReject,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* dark overlay – tap to close */}
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* centered dialog */}
      <View style={styles.centerWrap}>
        <View style={styles.card}>
          {/* header with title + X button */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            {/* Reject (optional) */}
            {onReject && (
              <CustomButton
                preset="danger"
                style={styles.button}
                onPress={onReject}
              >
                {rejectLabel}
              </CustomButton>
            )}

            {/* Approve / Confirm */}
            <CustomButton
              preset="success"
              style={[styles.button, onReject ? { marginLeft: 8 } : null]}
              onPress={onConfirm}
            >
              {confirmLabel}
            </CustomButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000066",
  },
  centerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#E89923",
    marginRight: 8,
  },
  closeIcon: {
    fontSize: 20,
    fontFamily: "Karla-Bold",
    color: "#6b7280",
  },
  message: {
    fontSize: 14,
    fontFamily: "Karla-Regular",
    color: "#4b5563",
    marginTop: 4,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    minWidth: 90,
  },
});

export default ConfirmModal;
