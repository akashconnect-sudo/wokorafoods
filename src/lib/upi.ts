export type UpiAppId =
  | "any"
  | "gpay"
  | "phonepe"
  | "paytm"
  | "bhim"
  | "amazonpay"
  | "cred"
  | "mobikwik";

export type UpiApp = {
  id: UpiAppId;
  name: string;
  hint: string;
  color: string;
};

export const UPI_APPS: UpiApp[] = [
  { id: "gpay", name: "Google Pay", hint: "GPay", color: "#4285F4" },
  { id: "phonepe", name: "PhonePe", hint: "PhonePe", color: "#5F259F" },
  { id: "paytm", name: "Paytm", hint: "Paytm", color: "#00BAF2" },
  { id: "bhim", name: "BHIM", hint: "BHIM UPI", color: "#0066B3" },
  { id: "amazonpay", name: "Amazon Pay", hint: "Amazon", color: "#FF9900" },
  { id: "cred", name: "CRED", hint: "CRED UPI", color: "#C9A227" },
  { id: "mobikwik", name: "MobiKwik", hint: "MobiKwik", color: "#E21B22" },
];

export function normalizeUpiVpa(value: string) {
  return value.trim().replace(/\s/g, "").toLowerCase();
}

export function isValidUpiVpa(value: string) {
  return /^[a-z0-9._-]{2,256}@[a-z]{2,64}$/i.test(normalizeUpiVpa(value));
}

export function upiAmount(rupees: number) {
  return Math.max(1, Math.round(rupees)).toFixed(2);
}

/** UPI apps reject a payee VPA when @ is encoded as %40, and they reject + for spaces. */
function encodeUpiValue(value: string) {
  return encodeURIComponent(value).replace(/%40/gi, "@");
}

function upiText(value: string, fallback: string, max: number) {
  const cleaned = value.replace(/[^\w\s.&-]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || fallback).slice(0, max);
}

export function buildUpiQuery(options: {
  vpa: string;
  payeeName: string;
  amount: number;
  note: string;
}) {
  const fields = {
    pa: normalizeUpiVpa(options.vpa),
    pn: upiText(options.payeeName, "Wokora Foods", 99),
    am: upiAmount(options.amount),
    cu: "INR",
    tn: upiText(options.note, "Wokora Foods", 50),
  };
  return Object.entries(fields)
    .map(([key, value]) => `${key}=${encodeUpiValue(value)}`)
    .join("&");
}

/** Generic intent — Android shows every installed UPI app. */
export function upiPayUri(query: string) {
  return `upi://pay?${query}`;
}

const ANDROID_UPI_PACKAGES: Record<Exclude<UpiAppId, "any">, string> = {
  gpay: "com.google.android.apps.nbu.paisa.user",
  phonepe: "com.phonepe.app",
  paytm: "net.one97.paytm",
  bhim: "in.org.npci.upiapp",
  amazonpay: "in.amazon.mShop.android.shopping",
  cred: "com.dreamplug.androidapp",
  mobikwik: "com.mobikwik_new",
};

/** Opens one installed Android app with a normal upi://pay request. */
export function androidUpiIntent(query: string, appId: Exclude<UpiAppId, "any">) {
  return `intent://pay?${query}#Intent;scheme=upi;package=${ANDROID_UPI_PACKAGES[appId]};end`;
}

export function upiAppUri(appId: UpiAppId, query: string) {
  switch (appId) {
    case "any":
      return upiPayUri(query);
    case "gpay":
      return `tez://upi/pay?${query}`;
    case "phonepe":
      return `phonepe://pay?${query}`;
    case "paytm":
      return `paytmmp://pay?${query}`;
    case "bhim":
      return `bhim://pay?${query}`;
    case "amazonpay":
      return `amazonpay://upi/pay?${query}`;
    case "cred":
      return `cred://upi/pay?${query}`;
    case "mobikwik":
      return `mobikwik://upi/pay?${query}`;
  }
}

export function gpayFallbackUri(query: string) {
  return `gpay://upi/pay?${query}`;
}
