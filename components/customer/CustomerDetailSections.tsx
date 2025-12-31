// components/customer/CustomerDetailSections.tsx
import React from "react";
import {
  DetailSectionCard,
  DetailRow,
} from "../card/DetailSectionCard";
import type { CustomerDetail } from "./CustomerDetailTypes";

type Translator = (key: string) => string;

const formatDate = (value?: string | null): string => {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

interface Props {
  data: CustomerDetail;
  t: Translator;
}

export const CustomerDetailSections: React.FC<Props> = ({ data, t }) => {
  const rawCustType = (data.cust_type || "").trim().toLowerCase();
  const isPersonal = rawCustType === "personal";
  const isCompany = rawCustType === "company";

  const addressLines = [
    data.address1,
    data.address2,
    data.address3,
  ].filter(Boolean) as string[];

  const renderPersonalBlock = () => {
    if (!isPersonal) return null;

    return (
      <>
        <DetailSectionCard
          title={
            (t("customer_view_section_personal") as string) ||
            "Personal Details"
          }
        >
          <DetailRow
            label={(t("customer_view_full_name") as string) || "Full name"}
            value={data.full_name || "-"}
          />
          <DetailRow
            label={
              (t("customer_view_email") as string) || "Email address"
            }
            value={data.email || "-"}
            uppercase={false}
          />
          <DetailRow
            label={(t("customer_view_phone") as string) || "Phone"}
            value={data.contact || "-"}
          />
          <DetailRow
            label={(t("customer_view_ic") as string) || "IC"}
            value={data.nric || "-"}
          />
          <DetailRow
            label={(t("customer_view_passport") as string) || "Passport"}
            value={data.passport || "-"}
          />
        </DetailSectionCard>

        <DetailSectionCard
          title={
            (t("customer_view_section_delivery") as string) ||
            "Delivery Address"
          }
        >
          <DetailRow
            label={
              (t("customer_view_delivery_address") as string) ||
              "Delivery address"
            }
            value={
              addressLines.length > 0
                ? addressLines.join(", ")
                : "-"
            }
          />
          <DetailRow
            label={(t("customer_view_city") as string) || "City"}
            value={data.city || "-"}
          />
          <DetailRow
            label={(t("customer_view_state") as string) || "State"}
            value={data.state || "-"}
          />
          <DetailRow
            label={(t("customer_view_postcode") as string) || "Postcode"}
            value={data.postcode || "-"}
          />
          <DetailRow
            label={(t("customer_view_country") as string) || "Country"}
            value={data.country || "-"}
          />
        </DetailSectionCard>

        <DetailSectionCard
          title={
            (t("customer_view_section_account") as string) || "Account"
          }
        >
          <DetailRow
            label={(t("customer_view_username") as string) || "Username"}
            value={data.username || "-"}
            uppercase={false}
          />
          <DetailRow
            label={(t("customer_view_created_at") as string) || "Created at"}
            value={formatDate(data.created_at)}
          />
        </DetailSectionCard>
      </>
    );
  };

  const renderCompanyBlock = () => {
    if (!isCompany) return null;

    return (
      <>
        <DetailSectionCard
          title={
            (t("customer_view_section_company") as string) ||
            "Company Details"
          }
        >
          <DetailRow
            label={
              (t("customer_view_company_name") as string) ||
              "Company name"
            }
            value={data.full_name || "-"}
          />
          <DetailRow
            label={(t("customer_view_brn_new") as string) || "BRN (New)"}
            value={data.brn_new || "-"}
          />
          <DetailRow
            label={(t("customer_view_brn_old") as string) || "BRN (Old)"}
            value={data.brn_old || "-"}
          />
          <DetailRow
            label={
              (t("customer_view_tin_number") as string) || "Company TIN"
            }
            value={data.tin_number || "-"}
          />
          <DetailRow
            label={
              (t("customer_view_sst_number") as string) || "SST Number"
            }
            value={data.sst_number || "-"}
          />
          <DetailRow
            label={
              (t("customer_view_email") as string) || "Email address"
            }
            value={data.email || "-"}
            uppercase={false}
          />
          <DetailRow
            label={(t("customer_view_pic_name") as string) || "PIC name"}
            value={data.pic || "-"}
          />
          <DetailRow
            label={(t("customer_view_contact") as string) || "Contact"}
            value={data.contact || "-"}
          />
        </DetailSectionCard>

        <DetailSectionCard
          title={
            (t("customer_view_section_business") as string) ||
            "Business Address"
          }
        >
          <DetailRow
            label={
              (t("customer_view_business_address") as string) ||
              "Business address"
            }
            value={
              addressLines.length > 0
                ? addressLines.join(", ")
                : "-"
            }
          />
          <DetailRow
            label={(t("customer_view_city") as string) || "City"}
            value={data.city || "-"}
          />
          <DetailRow
            label={(t("customer_view_state") as string) || "State"}
            value={data.state || "-"}
          />
          <DetailRow
            label={(t("customer_view_country") as string) || "Country"}
            value={data.country || "-"}
          />
          <DetailRow
            label={(t("customer_view_postcode") as string) || "Postcode"}
            value={data.postcode || "-"}
          />
          <DetailRow
            label={(t("customer_view_msic") as string) || "MSIC code"}
            value={data.msic || "-"}
          />
          <DetailRow
            label={
              (t("customer_view_msic_desc") as string) ||
              "MSIC description"
            }
            value={data.msic_desc || "-"}
          />
          <DetailRow
            label={
              (t("customer_view_einv_start_date") as string) ||
              "E-invoice start date"
            }
            value={formatDate(data.einv_start_date)}
          />
        </DetailSectionCard>

        <DetailSectionCard
          title={
            (t("customer_view_section_account") as string) || "Account"
          }
        >
          <DetailRow
            label={(t("customer_view_username") as string) || "Username"}
            value={data.username || "-"}
            uppercase={false}
          />
          <DetailRow
            label={(t("customer_view_created_at") as string) || "Created at"}
            value={formatDate(data.created_at)}
          />
        </DetailSectionCard>
      </>
    );
  };

  const renderMetaBlock = () => {
    const custCode =
      (data.cust_code && String(data.cust_code).trim()) || "-";
    const pkgName =
      (data.package_name && String(data.package_name).trim()) || "-";

    return (
      <DetailSectionCard
        title={(t("customer_view_section_meta") as string) || "Meta"}
      >
        <DetailRow
          label={(t("customer_view_status") as string) || "Customer status"}
          value={data.status || "-"}
        />
        <DetailRow
          label={(t("customer_view_acc_status") as string) || "Account status"}
          value={data.acc_status || "-"}
        />
        <DetailRow
          label={(t("customer_view_cust_code") as string) || "Customer code"}
          value={custCode}
        />
        <DetailRow
          label={(t("customer_view_package") as string) || "Customer package"}
          value={pkgName}
        />
      </DetailSectionCard>
    );
  };

  return (
    <>
      {renderPersonalBlock()}
      {renderCompanyBlock()}
      {renderMetaBlock()}
    </>
  );
};
