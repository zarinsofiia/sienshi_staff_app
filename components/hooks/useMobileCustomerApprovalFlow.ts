// components/hooks/useMobileCustomerApprovalFlow.ts
import { useCallback, useState } from "react";

import { API_BASE_URL } from "../../config/api";
import { authedFetch } from "../../config/mobileApiClient";
import { useLanguage } from "../../contexts/LanguageContext";
import type { CustomerPackage } from "../modal/CustomerPackageAssignModal";

type Translator = (key: string) => string;

interface ApproveCustomerResponse {
  message?: string;
}

interface UseMobileCustomerApprovalFlowOptions {
  /** Called after successful approve (e.g. reload list or refetch detail / navigate) */
  onAfterApprove?: () => Promise<void> | void;
  /** Called after successful reject (e.g. reload list / navigate back to listing) */
  onAfterReject?: () => Promise<void> | void;
}

export type MobileDialogType = "success" | "error";

export interface MobileDialogState {
  open: boolean;
  type: MobileDialogType;
  title: string;
  message: string;
}

export function useMobileCustomerApprovalFlow(
  options: UseMobileCustomerApprovalFlowOptions = {}
) {
  const { onAfterApprove, onAfterReject } = options;
  const { t } = useLanguage() as { t: Translator };

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] =
    useState<string>("");

  // which user is currently approving (for button loading state)
  const [approvingUserId, setApprovingUserId] = useState<number | null>(null);

  // 1st modal: confirm (approve / reject)
  const [confirmVisible, setConfirmVisible] = useState(false);

  // 2nd modal: assign code + package
  const [assignVisible, setAssignVisible] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignCustomerCode, setAssignCustomerCode] = useState("");
  const [assignPackages, setAssignPackages] = useState<CustomerPackage[]>([]);
  const [assignPackageId, setAssignPackageId] = useState<number | null>(null);

  // Reject reason modal
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // SweetAlert-style dialog (instead of Toast)
  const [dialog, setDialog] = useState<MobileDialogState | null>(null);

  // ---------- helpers ----------

  const loadPackages = useCallback(async () => {
    try {
      const res = await authedFetch(
        `${API_BASE_URL}/api/customers/getallcustomerpackages`,
        {
          method: "POST",
          body: JSON.stringify({
            fields: [
              "id",
              "package_name",
              "size_price",
              "weight_price",
              "usage_status",
            ],
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.log("getallcustomerpackages error:", res.status, text);
        throw new Error(text || "Failed to load packages");
      }

      const json = await res.json();
      const list: CustomerPackage[] = Array.isArray(json)
        ? json
        : Array.isArray((json as any)?.data)
        ? (json as any).data
        : [];

      setAssignPackages(list);
    } catch (err) {
      console.log("[useMobileCustomerApprovalFlow] loadPackages error:", err);
      setAssignPackages([]);
    }
  }, []);

  const generateCustomerCode = useCallback(
    async (baseNameOverride?: string) => {
      const baseName =
        baseNameOverride || selectedCustomerName || "New Customer";

      try {
        const res = await authedFetch(
          `${API_BASE_URL}/api/customers/generateCustomerCode`,
          {
            method: "POST",
            body: JSON.stringify({ name: baseName }),
          }
        );

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          console.log("generateCustomerCode error:", res.status, json);
          return;
        }

        const code = json?.code;
        if (code) {
          setAssignCustomerCode(String(code));
        }
      } catch (err) {
        console.log(
          "[useMobileCustomerApprovalFlow] generateCustomerCode exception:",
          err
        );
      }
    },
    [selectedCustomerName]
  );

  const openAssignModal = useCallback(async () => {
    if (!selectedUserId) return;

    setAssignLoading(true);
    setApprovingUserId(selectedUserId);
    try {
      setAssignCustomerCode("");
      setAssignPackageId(null);

      await Promise.all([loadPackages(), generateCustomerCode()]);

      setAssignVisible(true);
    } finally {
      setAssignLoading(false);
      setApprovingUserId(null);
    }
  }, [generateCustomerCode, loadPackages, selectedUserId]);

  const activePackages = assignPackages.filter(
    (p) => String(p.usage_status || "").toLowerCase() === "active"
  );

  // ---------- public API ----------

  /** Entry point: call when user taps "Approve" from list or view */
  const openForUser = (userId: number, customerName?: string) => {
    setSelectedUserId(userId);
    setSelectedCustomerName(customerName || "");
    setConfirmVisible(true);
  };

  // STEP 1: Confirm modal Approve → open assign modal
  const handleConfirmApprove = async () => {
    if (!selectedUserId) return;
    setConfirmVisible(false);
    await openAssignModal();
  };

  const handleConfirmClose = () => {
    setConfirmVisible(false);
    setSelectedUserId(null);
    setSelectedCustomerName("");
  };

  // STEP 1: Confirm modal Reject → open reject reason modal
  const handleRejectClick = () => {
    if (!selectedUserId) return;
    setConfirmVisible(false);
    setRejectReason("");
    setRejectVisible(true);
  };

  const handleRejectCancel = () => {
    if (rejectLoading) return;
    setRejectVisible(false);
    setRejectReason("");
    setSelectedUserId(null);
    setSelectedCustomerName("");
  };

  // STEP 2 (reject path): submit reject reason
  const handleRejectSubmit = async () => {
    if (!selectedUserId || !rejectReason.trim()) return;

    try {
      setRejectLoading(true);

      const res = await authedFetch(
        `${API_BASE_URL}/api/customers/rejectcustomer`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: String(selectedUserId),
            reject_reason: rejectReason.trim(),
          }),
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.log("rejectcustomer error:", res.status, json);

        setDialog({
          open: true,
          type: "error",
          title: t("customer_reject_error_title") || "Reject Failed",
          message:
            (json && json.message) ||
            t("customer_reject_error") ||
            "Failed to reject customer.",
        });
        return;
      }

      setDialog({
        open: true,
        type: "success",
        title: t("customer_reject_success_title") || "Customer rejected",
        message:
          (json && json.message) ||
          t("customer_reject_success_message") ||
          "Customer has been rejected.",
      });

      if (onAfterReject) {
        await onAfterReject();
      }

      handleRejectCancel();
    } catch (err) {
      console.log(
        "[useMobileCustomerApprovalFlow] handleRejectSubmit error:",
        err
      );

      setDialog({
        open: true,
        type: "error",
        title: t("customer_reject_error_title") || "Reject Failed",
        message:
          t("customer_reject_error") || "Failed to reject customer.",
      });
    } finally {
      setRejectLoading(false);
    }
  };

  const handleAssignCancel = () => {
    if (assignLoading) return;
    setAssignVisible(false);
    setAssignCustomerCode("");
    setAssignPackageId(null);
  };

  const handleAssignRandomize = async () => {
    await generateCustomerCode();
  };

  // STEP 2 (approve path): submit assign + approve
  const handleAssignSubmit = async () => {
    if (!selectedUserId || !assignCustomerCode || !assignPackageId) return;

    try {
      setAssignLoading(true);
      setApprovingUserId(selectedUserId);

      const res = await authedFetch(
        `${API_BASE_URL}/api/customers/approvecustomer`,
        {
          method: "POST",
          body: JSON.stringify({
            custCode: assignCustomerCode,
            customerPackage: String(assignPackageId),
            userId: String(selectedUserId),
          }),
        }
      );

      const json: ApproveCustomerResponse | null =
        (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        console.log("approvecustomer error:", res.status, json);

        setDialog({
          open: true,
          type: "error",
          title: t("customer_approve_error_title") || "Approve Failed",
          message:
            (json && json.message) ||
            t("customer_approve_error") ||
            "Failed to approve customer.",
        });
        return;
      }

      setDialog({
        open: true,
        type: "success",
        title: t("customer_approve_success_title") || "Approved",
        message:
          (json && json.message) ||
          t("customer_approve_success_message") ||
          "Customer has been approved.",
      });

      if (onAfterApprove) {
        await onAfterApprove();
      }

      handleAssignCancel();
      setSelectedUserId(null);
      setSelectedCustomerName("");
    } catch (err) {
      console.log(
        "[useMobileCustomerApprovalFlow] handleAssignSubmit error:",
        err
      );

      setDialog({
        open: true,
        type: "error",
        title: t("customer_approve_error_title") || "Approve Failed",
        message:
          t("customer_approve_error") ||
          "Failed to approve customer.",
      });
    } finally {
      setAssignLoading(false);
      setApprovingUserId(null);
    }
  };

  return {
    // selection
    selectedUserId,
    selectedCustomerName,
    approvingUserId,

    // SweetAlert-style dialog
    dialog,
    setDialog,

    // confirm modal
    confirmVisible,
    handleConfirmApprove,
    handleConfirmClose,
    handleRejectClick,

    // assign modal
    assignVisible,
    assignLoading,
    assignCustomerCode,
    setAssignCustomerCode,
    assignPackages: activePackages,
    assignPackageId,
    setAssignPackageId,
    handleAssignCancel,
    handleAssignRandomize,
    handleAssignSubmit,

    // reject modal
    rejectVisible,
    rejectLoading,
    rejectReason,
    setRejectReason,
    handleRejectCancel,
    handleRejectSubmit,

    // entry point
    openForUser,
  };
}

export type UseMobileCustomerApprovalFlowReturn = ReturnType<
  typeof useMobileCustomerApprovalFlow
>;
