import QRCode from "qrcode";
import { publicPayeeName, settlementVpa } from "@/lib/payoutAccount";
import {
  UPI_APPS,
  type UpiAppId,
  androidUpiIntent,
  buildUpiQuery,
  gpayFallbackUri,
  isValidUpiVpa,
  upiAppUri,
  upiPayUri,
} from "@/lib/upi";

export function buildOrderUpiQuery(order: { id: string; serialNumber: number; totalAmount: number }) {
  const vpa = settlementVpa();
  if (!isValidUpiVpa(vpa)) return "";
  const bill = order.serialNumber ? String(order.serialNumber).padStart(3, "0") : "order";
  return buildUpiQuery({
    vpa,
    payeeName: publicPayeeName(),
    amount: order.totalAmount,
    note: `Wokora ${bill}`,
  });
}

export function upiOpenUri(query: string, appId: string, ios: boolean) {
  const id = (UPI_APPS.some((app) => app.id === appId) ? appId : "any") as UpiAppId | "any";
  if (id === "any") return upiPayUri(query);
  if (ios) return id === "gpay" ? gpayFallbackUri(query) : upiAppUri(id, query);
  return androidUpiIntent(query, id);
}

export async function upiQrDataUrl(query: string) {
  if (!query) return "";
  return QRCode.toDataURL(upiPayUri(query), {
    margin: 1,
    width: 280,
    color: { dark: "#0D0D0D", light: "#FFFFFF" },
  });
}

export function publicUpiApps() {
  return UPI_APPS.map(({ id, name, hint, color }) => ({ id, name, hint, color }));
}
