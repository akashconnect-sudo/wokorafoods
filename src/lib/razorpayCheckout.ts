type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Payment is not available"));
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-razorpay]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Payment is not available")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment is not available"));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(orderId: string) {
  const res = await fetch(`/api/orders/${orderId}/razorpay`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Payment is not available");
  }
  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error("Payment is not available");

  await new Promise<void>((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency || "INR",
      name: data.name || "Wokora Foods",
      description: data.description || "Wokora Foods",
      order_id: data.razorpayOrderId,
      prefill: data.prefill,
      handler: async (response) => {
        const verify = await fetch(`/api/orders/${orderId}/razorpay/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (!verify.ok) {
          reject(new Error("Payment is not available"));
          return;
        }
        resolve();
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });
    checkout.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed"));
    });
    checkout.open();
  });
}
