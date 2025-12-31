// components/modal/RejectReasonModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import CustomButton from "../button/CustomButton";

interface RejectReasonModalProps {
  visible: boolean;
  loading?: boolean;
  title: string;
  reason: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  visible,
  loading = false,
  title,
  reason,
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.centerWrap}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>
            Please enter a reason for rejecting this customer.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter reject reason"
            value={reason}
            onChangeText={onReasonChange}
            editable={!loading}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.buttonRow}>
            <CustomButton
              preset="danger"
              style={styles.button}
              onPress={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </CustomButton>

            <CustomButton
              preset="success"
              style={[styles.button, { marginLeft: 8 }]}
              onPress={onConfirm}
              disabled={loading || !reason.trim()}
              loading={loading}
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
    width: "85%",
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
  title: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#E89923",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#4b5563",
    marginBottom: 8,
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#111827",
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    minWidth: 90,
  },
});

export default RejectReasonModal;
