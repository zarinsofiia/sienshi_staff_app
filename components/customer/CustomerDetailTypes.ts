// components/customer/CustomerDetailTypes.ts

export interface CustomerDetail {
  id?: number;
  user_id?: number;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  contact?: string | null;

  cust_type?: string | null;
  status?: string | null;
  acc_status?: string | null;
  date_approved?: string | null;
  approved_by?: string | null;

  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  postcode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;

  brn_new?: string | null;
  brn_old?: string | null;
  tin_number?: string | null;
  nric?: string | null;
  passport?: string | null;
  sst_number?: string | null;
  msic?: string | null;
  msic_desc?: string | null;
  einv_start_date?: string | null;

  created_at?: string | null;

  cust_code?: string | null;
  package_id?: number | null;
  package_name?: string | null;

  [key: string]: any;
}
