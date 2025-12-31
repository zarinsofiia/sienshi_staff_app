// components/modal/MobileAlertDialog.tsx
import React from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import CustomButton from "../button/CustomButton";
import type {
  MobileDialogState,
} from "../hooks/useMobileCustomerApprovalFlow";

interface Props {
  dialog: MobileDialogState | null;
  onClose: () => void;
}

const MobileAlertDialog: React.FC<Props> = ({ dialog, onClose }) => {
  if (!dialog?.open) return null;

  const isSuccess = dialog.type === "success";

  return (
    <Modal
      visible={dialog.open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isSuccess ? "#dcfce7" : "#fee2e2" },
            ]}
          >
            <Text style={styles.iconText}>{isSuccess ? "✓" : "!"}</Text>
          </View>

          <Text style={styles.title}>{dialog.title}</Text>
          <Text style={styles.message}>{dialog.message}</Text>

          <View style={styles.buttonRow}>
            <CustomButton preset="success" onPress={onClose}>
              OK
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
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconText: {
    fontSize: 20,
    fontFamily: "Karla-Bold",
    color: "#166534",
  },
  title: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontFamily: "Karla-Regular",
    color: "#4b5563",
    marginBottom: 16,
  },
  buttonRow: {
    alignItems: "flex-end",
  },
});

export default MobileAlertDialog;
