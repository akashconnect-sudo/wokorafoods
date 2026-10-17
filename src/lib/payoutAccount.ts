import { isValidUpiVpa, normalizeUpiVpa } from "@/lib/upi";

/** Customer-facing name only. Never return bank fields to the browser. */
export function publicPayeeName() {
  return (process.env.UPI_PAYEE_NAME || "Wokora Foods").trim().slice(0, 99) || "Wokora Foods";
}

/** Server-only destination VPA from UPI_VPA. Do not import this module from client components. */
export function settlementVpa() {
  const explicit = normalizeUpiVpa(process.env.UPI_VPA || "");
  if (isValidUpiVpa(explicit)) return explicit;
  return "";
}
