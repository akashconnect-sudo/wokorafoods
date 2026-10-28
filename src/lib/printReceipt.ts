import { prisma } from "./prisma";
import { DEFAULT_STORE_ID } from "./store";

export type PrintableOrder = {
  id: string;
  tableNumber: string | null;
  type: "dine_in" | "takeaway";
  items: { name: string; quantity: number; price: number; customization?: string }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: Date | string;
  customerName?: string;
  customerPhone?: string;
};

/**
 * printReceipt(order)
 *
 * Swap PRINT_MODE without touching order APIs:
 *
 * Approach 1 — Local Print Bridge (recommended for a USB/LAN thermal printer)
 *   PRINT_MODE=agent
 *   Run /print-agent on a cafe PC or Raspberry Pi. That service polls
 *   /api/print-queue or receives POST {PRINT_AGENT_URL}/print and prints
 *   via node-thermal-printer / ESC-POS.
 *
 * Approach 2 — Cloud / networked ESC-POS printer
 *   PRINT_MODE=escpos
 *   Send raw ESC/POS bytes to PRINTER_IP:PRINTER_PORT (same LAN, VPN, or
 *   a vendor cloud relay). See comments in sendEscpos().
 *
 * Approach 3 — Kiosk browser auto-print (DEFAULT, working now)
 *   PRINT_MODE=kiosk
 *   Jobs are stored as PrintJob rows. The /admin/kiosk page polls
 *   /api/print-queue and calls window.print() on a receipt layout.
 */
export async function printReceipt(order: PrintableOrder) {
  const job = await prisma.printJob.create({
    data: {
      orderId: order.id,
      status: "pending",
      payload: JSON.stringify(order),
      storeId: DEFAULT_STORE_ID,
    },
  });

  const mode = process.env.PRINT_MODE || "kiosk";

  if (mode === "agent") {
    await sendToPrintAgent(order);
  }

  if (mode === "escpos") {
    await sendEscpos(order);
  }

  await notifyWhatsApp(order);

  return job;
}

async function sendToPrintAgent(order: PrintableOrder) {
  const url = process.env.PRINT_AGENT_URL;
  if (!url) {
    console.warn("[print] PRINT_AGENT_URL missing — job left in queue for polling");
    return;
  }

  try {
    await fetch(`${url.replace(/\/$/, "")}/print`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PRINT_AGENT_SECRET || ""}`,
      },
      body: JSON.stringify(order),
    });
  } catch (error) {
    console.warn("[print] print-agent unreachable, relying on queue poll", error);
  }
}

/**
 * Approach 2 scaffold. In production open a TCP socket to the printer
 * (port 9100 is typical) and write ESC/POS. On a public Node host you cannot open
 * arbitrary TCP sockets — use a cafe-side relay, VPN, or vendor API.
 */
async function sendEscpos(order: PrintableOrder) {
  const ip = process.env.PRINTER_IP;
  const port = process.env.PRINTER_PORT || "9100";
  if (!ip) {
    console.warn("[print] PRINTER_IP not set — ESC/POS skipped");
    return;
  }

  console.info(`[print] ESC/POS target ${ip}:${port} for order ${order.id}`);
  // const net = await import("net");
  // const socket = net.connect({ host: ip, port: Number(port) });
  // socket.write(buildEscposBuffer(order));
  // socket.end();
}

async function notifyWhatsApp(order: PrintableOrder) {
  if (process.env.WHATSAPP_NOTIFY !== "true" || !order.customerPhone) return;

  const text = `Wokora Foods — order ${order.id.slice(-6).toUpperCase()} received. Total ₹${Math.round(order.totalAmount)}. Table ${order.tableNumber || "takeaway"}.`;

  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    console.info(`[whatsapp] ${order.customerPhone}: ${text}`);
    return;
  }

  // WhatsApp Cloud API placeholder
  // await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, { ... })
}

export function buildReceiptHtml(order: PrintableOrder) {
  const when = new Date(order.createdAt).toLocaleString("en-IN");
  const rows = order.items
    .map((item) => {
      const note = (item.customization || "").trim();
      const label = note
        ? `${item.name}<br/><small style="color:#333">★ ${note}</small>`
        : item.name;
      return `<tr><td>${label}</td><td>${item.quantity}</td><td>₹${item.price * item.quantity}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Wokora Foods Receipt</title>
  <style>
    body { font-family: ui-monospace, monospace; width: 280px; margin: 0; padding: 12px; color: #111; }
    h1 { font-size: 18px; text-align: center; margin: 0 0 4px; }
    p, td { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 3px 0; }
    .muted { color: #444; text-align: center; }
    .total { font-weight: 700; border-top: 1px dashed #111; }
  </style>
</head>
<body>
  <h1>WOKORA FOODS</h1>
  <p class="muted">Good Food. Better Mood.</p>
  <p>Order: WF-${order.id.slice(-6).toUpperCase()}<br/>
     ${order.type === "dine_in" ? `Table ${order.tableNumber || "-"}` : "Takeaway"}<br/>
     ${when}</p>
  <table>${rows}
    <tr class="total"><td>Subtotal</td><td></td><td>₹${Math.round(order.subtotal)}</td></tr>
    <tr><td>GST (5%)</td><td></td><td>₹${Math.round(order.taxAmount)}</td></tr>
    <tr class="total"><td>Total</td><td></td><td>₹${Math.round(order.totalAmount)}</td></tr>
  </table>
  <p class="muted">Taste Talks Here</p>
</body>
</html>`;
}
