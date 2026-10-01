import nodemailer, { type Transporter } from "nodemailer";

export interface LeadEmailPayload {
  id?: string;
  source?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  service_type?: string;
  estimated_budget?: string;
  project_scope?: string;
  created_at?: string;
}

// In-memory deduplication tracking (to prevent duplicate emails if a submission triggers multiple backend routes)
const recentDispatchedEmails = new Map<string, number>();
const inFlightDispatches = new Set<string>();

// Prune entries older than 10 minutes
function pruneOldDeduplicationEntries(): void {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, timestamp] of recentDispatchedEmails.entries()) {
    if (timestamp < tenMinutesAgo) {
      recentDispatchedEmails.delete(key);
    }
  }
}

/**
 * Generate a unique fingerprint key for deduplication.
 * Uses phone + email + service_type/name so simultaneous or near-simultaneous calls
 * (such as QuoteModal calling both /api/supabase/submit-lead and /api/quote)
 * only send exactly one email.
 */
export function getLeadDedupKey(lead: LeadEmailPayload): string {
  const phoneClean = (lead.phone || "").replace(/\D/g, "").slice(-10);
  const emailClean = (lead.email || "").trim().toLowerCase();
  const nameClean = (lead.full_name || "").trim().toLowerCase();
  const sourceClean = (lead.source || "").trim().toLowerCase();

  if (phoneClean && phoneClean.length >= 7) {
    return `${phoneClean}_${emailClean || nameClean}`;
  }
  if (emailClean && emailClean !== "n/a" && emailClean.includes("@")) {
    return `${emailClean}_${nameClean}`;
  }
  return `${nameClean}_${sourceClean}`;
}

let cachedTransporter: Transporter | null = null;

export function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "false" ? false : true;
  const user = process.env.SMTP_USER || "enquiry@royalepicinterior.com";
  const pass = process.env.SMTP_PASS;

  if (!pass) {
    console.warn(
      "[Hostinger SMTP] Notice: SMTP_PASS environment variable is not set. SMTP notification email will be skipped safely without affecting lead capture."
    );
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    });
  }

  return cachedTransporter;
}

/**
 * Build a clean, luxury, high-conversion HTML email template.
 */
export function formatLeadEmailHtml(lead: LeadEmailPayload): string {
  const customerName = lead.full_name || "Valued Client";
  const phone = lead.phone || "N/A";
  const email = lead.email || "N/A";
  const service = lead.service_type || "Interior Consultation & Design";
  const budget = lead.estimated_budget || "Standard Consultation Range";
  const city = lead.city || "Bengaluru";
  const source = lead.source || "Website Enquiry Form";
  const leadId = lead.id || `LEAD-${Date.now().toString().slice(-6)}`;
  const scopeMessage = lead.project_scope || "No additional notes provided by client.";

  let formattedDate = "";
  try {
    const d = lead.created_at ? new Date(lead.created_at) : new Date();
    formattedDate = d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    });
  } catch {
    formattedDate = new Date().toISOString();
  }

  const phoneTelLink = phone !== "N/A" ? phone.replace(/[^0-9+]/g, "") : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Website Enquiry</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0d0d0d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e5e5e5;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0d0d0d;
      padding: 30px 10px;
    }
    .main-table {
      max-width: 600px;
      margin: 0 auto;
      background-color: #171717;
      border: 1px solid #333333;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }
    .header-bar {
      background: linear-gradient(135deg, #1f1a10 0%, #121212 100%);
      border-bottom: 2px solid #C5A059;
      padding: 28px 24px;
      text-align: center;
    }
    .brand-title {
      color: #C5A059;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0 0 6px 0;
    }
    .brand-sub {
      color: #999999;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0;
    }
    .banner {
      background-color: #221d13;
      border-bottom: 1px solid #3d311b;
      padding: 12px 24px;
      text-align: center;
    }
    .banner-text {
      color: #e6ca85;
      font-size: 13px;
      font-weight: 600;
      margin: 0;
    }
    .content-padding {
      padding: 24px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 24px 0;
    }
    .details-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #262626;
      font-size: 13px;
    }
    .details-label {
      width: 35%;
      color: #888888;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .details-value {
      color: #ffffff;
      font-weight: 500;
    }
    .highlight-pill {
      display: inline-block;
      background-color: #2b2315;
      color: #dfba6c;
      border: 1px solid #C5A059;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
    }
    .message-box {
      background-color: #121212;
      border: 1px solid #2e2e2e;
      border-left: 3px solid #C5A059;
      border-radius: 8px;
      padding: 14px 16px;
      color: #d4d4d4;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-line;
      margin-top: 6px;
    }
    .action-buttons {
      text-align: center;
      padding: 16px 0 8px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 22px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 4px 6px;
    }
    .btn-gold {
      background: #C5A059;
      color: #000000;
    }
    .btn-dark {
      background: #262626;
      color: #ffffff;
      border: 1px solid #404040;
    }
    .footer {
      background-color: #111111;
      border-top: 1px solid #262626;
      padding: 20px 24px;
      text-align: center;
      color: #737373;
      font-size: 11px;
      line-height: 1.5;
    }
    .footer a {
      color: #C5A059;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0">
      <!-- Header -->
      <tr>
        <td class="header-bar">
          <div class="brand-title">Royal Epic Interior</div>
          <div class="brand-sub">Luxury Architecture & Turnkey Design Studio</div>
        </td>
      </tr>

      <!-- Notification Banner -->
      <tr>
        <td class="banner">
          <p class="banner-text">✨ New Website Enquiry Received</p>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td class="content-padding">
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #a3a3a3;">
            A customer has submitted a new inquiry through your official web portal. Details are outlined below:
          </p>

          <table class="details-table" cellpadding="0" cellspacing="0">
            <tr>
              <td class="details-label">Form / Source</td>
              <td class="details-value"><span class="highlight-pill">${source}</span></td>
            </tr>
            <tr>
              <td class="details-label">Customer Name</td>
              <td class="details-value" style="font-size: 15px; font-weight: 700; color: #ffffff;">${customerName}</td>
            </tr>
            <tr>
              <td class="details-label">Phone Number</td>
              <td class="details-value">
                ${
                  phoneTelLink
                    ? `<a href="tel:${phoneTelLink}" style="color: #C5A059; text-decoration: none; font-weight: 600;">📞 ${phone}</a>`
                    : phone
                }
              </td>
            </tr>
            <tr>
              <td class="details-label">Email Address</td>
              <td class="details-value">
                ${
                  email !== "N/A"
                    ? `<a href="mailto:${email}" style="color: #60a5fa; text-decoration: none;">✉️ ${email}</a>`
                    : '<span style="color: #737373;">Not provided</span>'
                }
              </td>
            </tr>
            <tr>
              <td class="details-label">Service / Project</td>
              <td class="details-value">${service}</td>
            </tr>
            <tr>
              <td class="details-label">Estimated Budget</td>
              <td class="details-value" style="font-weight: 700; color: #34d399;">${budget}</td>
            </tr>
            <tr>
              <td class="details-label">Location / City</td>
              <td class="details-value">${city}</td>
            </tr>
            <tr>
              <td class="details-label">Submission Time</td>
              <td class="details-value" style="color: #a3a3a3; font-size: 12px;">${formattedDate} (IST)</td>
            </tr>
            <tr>
              <td class="details-label">Lead Reference ID</td>
              <td class="details-value"><code style="color: #d4d4d4; font-family: monospace;">${leadId}</code></td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888888; letter-spacing: 0.5px; margin-bottom: 4px;">
              Project Scope / Message:
            </div>
            <div class="message-box">
              ${scopeMessage}
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="action-buttons" style="margin-top: 24px;">
            ${
              phoneTelLink
                ? `<a href="tel:${phoneTelLink}" class="btn btn-gold">Call Customer Now</a>`
                : ""
            }
            ${
              email !== "N/A" && email.includes("@")
                ? `<a href="mailto:${email}?subject=Royal%20Epic%20Interior%20-%20Regarding%20Your%20${encodeURIComponent(
                    service
                  )}%20Enquiry" class="btn btn-dark">Reply via Email</a>`
                : ""
            }
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="footer">
          <div><strong>Royal Epic Interior & Furniture</strong></div>
          <div>No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru, Karnataka 560077</div>
          <div style="margin-top: 6px; color: #525252;">
            Automated Hostinger SMTP notification engine • Do not share confidential credentials
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Plain-text fallback for email clients that do not support HTML.
 */
export function formatLeadEmailText(lead: LeadEmailPayload): string {
  const customerName = lead.full_name || "Valued Client";
  const phone = lead.phone || "N/A";
  const email = lead.email || "N/A";
  const service = lead.service_type || "Interior Consultation";
  const budget = lead.estimated_budget || "Standard Consultation Range";
  const city = lead.city || "Bengaluru";
  const source = lead.source || "Website Enquiry Form";
  const leadId = lead.id || `LEAD-${Date.now().toString().slice(-6)}`;
  const scopeMessage = lead.project_scope || "No additional notes provided.";

  return `
=========================================
NEW WEBSITE ENQUIRY - ROYAL EPIC INTERIOR
=========================================

Form / Source:     ${source}
Reference ID:      ${leadId}
Customer Name:     ${customerName}
Phone Number:      ${phone}
Email:             ${email}
Service Required:  ${service}
Estimated Budget:  ${budget}
City / Location:   ${city}
Submission Time:   ${new Date().toISOString()}

Project Scope / Message:
------------------------
${scopeMessage}

=========================================
Royal Epic Interior & Furniture
Thanisandra, Bengaluru, Karnataka 560077
=========================================
`.trim();
}

/**
 * Sends an email notification using Hostinger SMTP.
 * - Saves lead to DB first (handled by caller).
 * - Enforces deduplication: identical lead requests within 60s will send exactly 1 email.
 * - Completely fail-safe: failures are logged and returned as { success: false, error },
 *   NEVER throwing or breaking customer-facing API responses.
 * - Never logs or reveals SMTP credentials.
 */
export async function sendLeadNotificationEmail(
  lead: LeadEmailPayload
): Promise<{ success: boolean; skipped?: boolean; error?: string; messageId?: string }> {
  pruneOldDeduplicationEntries();

  const dedupKey = getLeadDedupKey(lead);
  const now = Date.now();

  // Deduplication check: if in-flight or sent within last 60 seconds, skip
  if (inFlightDispatches.has(dedupKey)) {
    console.log(`[Hostinger SMTP] Deduplication: in-flight request matching key (${dedupKey}), skipping duplicate email.`);
    return { success: true, skipped: true, error: "duplicate_in_flight" };
  }

  const lastSentTime = recentDispatchedEmails.get(dedupKey);
  if (lastSentTime && now - lastSentTime < 60000) {
    console.log(
      `[Hostinger SMTP] Deduplication: suppressed duplicate email for (${dedupKey}), sent ${Math.round(
        (now - lastSentTime) / 1000
      )}s ago.`
    );
    return { success: true, skipped: true, error: "duplicate_within_60s" };
  }

  const transporter = getTransporter();
  if (!transporter) {
    // Missing SMTP_PASS or transporter creation returned null
    return {
      success: false,
      skipped: true,
      error: "SMTP_PASS not configured in server environment.",
    };
  }

  inFlightDispatches.add(dedupKey);

  const senderUser = process.env.SMTP_USER || "enquiry@royalepicinterior.com";
  const receiverEmail =
    process.env.NOTIFICATION_RECEIVER_EMAIL ||
    process.env.SMTP_USER ||
    "enquiry@royalepicinterior.com";

  const customerName = lead.full_name || "Website Visitor";
  const service = lead.service_type || "General Interior Consultation";
  const source = lead.source || "Website Enquiry";

  const mailOptions = {
    from: `"Royal Epic Interior" <${senderUser}>`,
    to: receiverEmail,
    replyTo: lead.email && lead.email.includes("@") ? lead.email : senderUser,
    subject: `New Website Enquiry: ${customerName} - ${service} [${source}]`,
    text: formatLeadEmailText(lead),
    html: formatLeadEmailHtml(lead),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    recentDispatchedEmails.set(dedupKey, Date.now());
    inFlightDispatches.delete(dedupKey);

    console.log(
      `✅ [Hostinger SMTP] Notification email delivered successfully! MessageID: ${info.messageId} | Destination: ${receiverEmail}`
    );
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    inFlightDispatches.delete(dedupKey);
    // Sanitize any potential error output to never leak sensitive auth details
    const cleanError = err?.message?.replace(/pass=[^&\s]+/gi, "pass=***") || "SMTP dispatch error";
    console.error(`⚠️ [Hostinger SMTP] Failed to dispatch email notification: ${cleanError}`);
    return { success: false, error: cleanError };
  }
}

/**
 * Diagnostic status for admin / health checks without leaking secrets.
 */
export function getSmtpConfigStatus() {
  return {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE === "false" ? false : true,
    user: process.env.SMTP_USER || "enquiry@royalepicinterior.com",
    receiver:
      process.env.NOTIFICATION_RECEIVER_EMAIL ||
      process.env.SMTP_USER ||
      "enquiry@royalepicinterior.com",
    isConfigured: Boolean(process.env.SMTP_PASS && process.env.SMTP_PASS.trim().length > 0),
  };
}

// -------------------------------------------------------------
// ORDER NOTIFICATION EMAIL PIPELINE (HOSTINGER SMTP)
// -------------------------------------------------------------

export interface OrderEmailItem {
  product_id?: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_variation?: any;
  selected_attributes?: Record<string, string>;
}

export interface OrderEmailPayload {
  order_id: string;
  order_number: string;
  order_date?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | string | any;
  items: OrderEmailItem[];
  subtotal: number;
  shipping_charge?: number;
  discount?: number;
  tax?: number;
  final_total: number;
  currency?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  payment_status: string;
}

// In-memory deduplication tracking for order emails
const recentDispatchedOrderEmails = new Map<string, number>();
const inFlightOrderDispatches = new Set<string>();

// Prune order deduplication records older than 24 hours
function pruneOldOrderDeduplicationEntries(): void {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, timestamp] of recentDispatchedOrderEmails.entries()) {
    if (timestamp < oneDayAgo) {
      recentDispatchedOrderEmails.delete(key);
    }
  }
}

export function getOrderDedupKey(order: OrderEmailPayload): string {
  const paymentId = (order.razorpay_payment_id || "").trim();
  const orderNum = (order.order_number || order.order_id || "").trim();
  if (paymentId) {
    return `${orderNum}_${paymentId}`;
  }
  return orderNum;
}

function formatAddressString(addr: any): string {
  if (!addr) return "Not provided / Direct architectural consultation order";
  if (typeof addr === "string") return addr.trim() || "Not provided";
  const parts = [
    addr.address,
    addr.city,
    addr.state,
    addr.pincode ? `PIN: ${addr.pincode}` : ""
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Not provided";
}

function formatItemVariation(variation: any, attributes?: Record<string, string>): string {
  const parts: string[] = [];
  if (variation) {
    if (typeof variation === "string" && variation.trim()) {
      parts.push(variation.trim());
    } else if (typeof variation === "object") {
      if (variation.name) parts.push(String(variation.name));
      if (variation.finish) parts.push(`Finish: ${variation.finish}`);
      if (variation.wood) parts.push(`Wood: ${variation.wood}`);
      if (variation.size) parts.push(`Size: ${variation.size}`);
      if (variation.color) parts.push(`Color: ${variation.color}`);
    }
  }
  if (attributes && typeof attributes === "object") {
    for (const [k, v] of Object.entries(attributes)) {
      if (v) parts.push(`${k}: ${v}`);
    }
  }
  return parts.join(" • ");
}

function formatRupee(amount: number): string {
  const val = Number(amount) || 0;
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * High-conversion luxury HTML template for order confirmation.
 */
export function formatOrderEmailHtml(order: OrderEmailPayload): string {
  let formattedDate = "";
  try {
    const d = order.order_date ? new Date(order.order_date) : new Date();
    formattedDate = d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    });
  } catch {
    formattedDate = new Date().toISOString();
  }

  const customerName = order.customer_name || "Valued Client";
  const phone = order.customer_phone || "N/A";
  const email = order.customer_email || "N/A";
  const addressText = formatAddressString(order.shipping_address);
  const phoneTelLink = phone !== "N/A" ? phone.replace(/[^0-9+]/g, "") : "";

  // Render product table rows
  const itemRowsHtml = (order.items || []).map((item, idx) => {
    const variationText = formatItemVariation(item.selected_variation, item.selected_attributes);
    return `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #262626; vertical-align: top;">
          <div style="font-weight: 700; color: #ffffff; font-size: 13px;">${idx + 1}. ${item.product_name}</div>
          ${variationText ? `<div style="font-size: 11px; color: #dfba6c; margin-top: 3px;">${variationText}</div>` : ""}
          ${item.product_id ? `<div style="font-size: 10px; color: #666666; margin-top: 2px;">SKU / ID: ${item.product_id}</div>` : ""}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #262626; text-align: center; color: #e5e5e5; font-size: 13px; font-weight: 600; vertical-align: top;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #262626; text-align: right; color: #a3a3a3; font-size: 13px; vertical-align: top;">
          ${formatRupee(item.unit_price)}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #262626; text-align: right; color: #ffffff; font-weight: 700; font-size: 13px; vertical-align: top;">
          ${formatRupee(item.total_price)}
        </td>
      </tr>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Received - #${order.order_number}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0d0d0d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e5e5e5;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0d0d0d;
      padding: 30px 10px;
    }
    .main-table {
      max-width: 640px;
      margin: 0 auto;
      background-color: #171717;
      border: 1px solid #333333;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
    }
    .header-bar {
      background: linear-gradient(135deg, #1f1a10 0%, #121212 100%);
      border-bottom: 2px solid #C5A059;
      padding: 28px 24px;
      text-align: center;
    }
    .brand-title {
      color: #C5A059;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0 0 6px 0;
    }
    .brand-sub {
      color: #999999;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0;
    }
    .banner {
      background-color: #14281d;
      border-bottom: 1px solid #1e4530;
      padding: 14px 24px;
      text-align: center;
    }
    .banner-text {
      color: #4ade80;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .highlight-card {
      background-color: #1f1a10;
      border: 1px solid #4a3b1d;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 20px 0;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #C5A059;
      letter-spacing: 1px;
      margin-bottom: 10px;
      border-bottom: 1px solid #2e2617;
      padding-bottom: 4px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .details-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #262626;
      font-size: 13px;
    }
    .details-label {
      width: 35%;
      color: #888888;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .details-value {
      color: #ffffff;
      font-weight: 500;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px 0;
      background-color: #121212;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #292929;
    }
    .items-table th {
      background-color: #1c1c1c;
      color: #C5A059;
      padding: 10px 14px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #333333;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .totals-table td {
      padding: 6px 14px;
      font-size: 13px;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 4px 6px;
    }
    .btn-gold {
      background: #C5A059;
      color: #000000;
    }
    .btn-dark {
      background: #262626;
      color: #ffffff;
      border: 1px solid #404040;
    }
    .footer {
      background-color: #111111;
      border-top: 1px solid #262626;
      padding: 20px 24px;
      text-align: center;
      color: #737373;
      font-size: 11px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0">
      <!-- Header -->
      <tr>
        <td class="header-bar">
          <div class="brand-title">Royal Epic Interior</div>
          <div class="brand-sub">Luxury Architecture & Turnkey Design Studio</div>
        </td>
      </tr>

      <!-- Notification Banner -->
      <tr>
        <td class="banner">
          <p class="banner-text">✓ Payment Verified • New Order Received</p>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td style="padding: 24px;">
          <!-- Highlight Box -->
          <div class="highlight-card">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size: 11px; color: #C5A059; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Order Reference</div>
                  <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 4px;">#${order.order_number}</div>
                  <div style="font-size: 12px; color: #a3a3a3; margin-top: 4px;">Placed on: ${formattedDate} (IST)</div>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <div style="font-size: 11px; color: #a3a3a3; text-transform: uppercase; font-weight: 700;">Amount Paid</div>
                  <div style="font-size: 24px; font-weight: 800; color: #4ade80; margin-top: 4px;">${formatRupee(order.final_total)}</div>
                  <div style="display: inline-block; background-color: #14281d; color: #4ade80; border: 1px solid #1e4530; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-top: 4px;">
                    PAID (Razorpay)
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Customer & Delivery Information -->
          <div class="section-title">Customer & Shipping Information</div>
          <table class="details-table" cellpadding="0" cellspacing="0">
            <tr>
              <td class="details-label">Customer Name</td>
              <td class="details-value" style="font-size: 14px; font-weight: 700; color: #ffffff;">${customerName}</td>
            </tr>
            <tr>
              <td class="details-label">Phone Number</td>
              <td class="details-value">
                ${
                  phoneTelLink
                    ? `<a href="tel:${phoneTelLink}" style="color: #C5A059; text-decoration: none; font-weight: 600;">📞 ${phone}</a>`
                    : phone
                }
              </td>
            </tr>
            <tr>
              <td class="details-label">Email Address</td>
              <td class="details-value">
                ${
                  email !== "N/A"
                    ? `<a href="mailto:${email}" style="color: #60a5fa; text-decoration: none;">✉️ ${email}</a>`
                    : '<span style="color: #737373;">Not provided</span>'
                }
              </td>
            </tr>
            <tr>
              <td class="details-label">Shipping / Delivery Address</td>
              <td class="details-value" style="color: #e5e5e5; line-height: 1.5;">${addressText}</td>
            </tr>
          </table>

          <!-- Purchased Products List -->
          <div class="section-title" style="margin-top: 20px;">Products Purchased (${(order.items || []).length} item${(order.items || []).length !== 1 ? 's' : ''})</div>
          <table class="items-table" cellpadding="0" cellspacing="0">
            <thead>
              <tr>
                <th style="text-align: left;">Product</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 110px;">Unit Price</th>
                <th style="text-align: right; width: 110px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>

          <!-- Financial Calculation Breakdown -->
          <div class="section-title">Payment & Financial Summary</div>
          <table class="totals-table" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #888888;">Items Subtotal:</td>
              <td style="text-align: right; color: #ffffff; font-weight: 600;">${formatRupee(order.subtotal)}</td>
            </tr>
            ${
              order.discount && order.discount > 0
                ? `<tr>
                    <td style="color: #888888;">Discount Applied:</td>
                    <td style="text-align: right; color: #f87171; font-weight: 600;">- ${formatRupee(order.discount)}</td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="color: #888888;">Shipping / Delivery Charge:</td>
              <td style="text-align: right; color: #ffffff;">
                ${order.shipping_charge && order.shipping_charge > 0 ? formatRupee(order.shipping_charge) : '<span style="color: #4ade80;">FREE (Standard)</span>'}
              </td>
            </tr>
            ${
              order.tax && order.tax > 0
                ? `<tr>
                    <td style="color: #888888;">Taxes & GST:</td>
                    <td style="text-align: right; color: #ffffff;">${formatRupee(order.tax)}</td>
                  </tr>`
                : ""
            }
            <tr>
              <td colspan="2" style="border-top: 1px solid #333333; padding-top: 10px;"></td>
            </tr>
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: #C5A059;">Final Total Paid:</td>
              <td style="text-align: right; font-size: 20px; font-weight: 800; color: #4ade80;">${formatRupee(order.final_total)}</td>
            </tr>
          </table>

          <!-- Razorpay & Transaction Audit Reference -->
          <div class="section-title" style="margin-top: 24px;">Payment Audit & Gateway References</div>
          <table class="details-table" cellpadding="0" cellspacing="0">
            <tr>
              <td class="details-label">Razorpay Order ID</td>
              <td class="details-value"><code style="color: #d4d4d4; font-family: monospace;">${order.razorpay_order_id}</code></td>
            </tr>
            <tr>
              <td class="details-label">Razorpay Payment ID</td>
              <td class="details-value"><code style="color: #4ade80; font-family: monospace; font-weight: 700;">${order.razorpay_payment_id}</code></td>
            </tr>
            <tr>
              <td class="details-label">Payment Status</td>
              <td class="details-value"><span style="color: #4ade80; font-weight: 700;">VERIFIED & PAID</span></td>
            </tr>
            <tr>
              <td class="details-label">Internal Order UUID</td>
              <td class="details-value"><code style="color: #888888; font-family: monospace; font-size: 11px;">${order.order_id}</code></td>
            </tr>
          </table>

          <!-- Quick Action Buttons -->
          <div style="text-align: center; margin-top: 24px;">
            ${
              phoneTelLink
                ? `<a href="tel:${phoneTelLink}" class="btn btn-gold">Call Customer</a>`
                : ""
            }
            ${
              email !== "N/A" && email.includes("@")
                ? `<a href="mailto:${email}?subject=Royal%20Epic%20Interior%20-%20Order%20Confirmation%20%23${encodeURIComponent(
                    order.order_number
                  )}" class="btn btn-dark">Email Customer</a>`
                : ""
            }
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="footer">
          <div><strong>Royal Epic Interior & Furniture</strong></div>
          <div>No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru, Karnataka 560077</div>
          <div style="margin-top: 6px; color: #525252;">
            Automated Hostinger SMTP notification engine • enquiry@royalepicinterior.com
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Plain-text fallback for order confirmation email.
 */
export function formatOrderEmailText(order: OrderEmailPayload): string {
  const customerName = order.customer_name || "Valued Client";
  const phone = order.customer_phone || "N/A";
  const email = order.customer_email || "N/A";
  const addressText = formatAddressString(order.shipping_address);

  const itemsText = (order.items || []).map((item, idx) => {
    const variationText = formatItemVariation(item.selected_variation, item.selected_attributes);
    return `${idx + 1}. ${item.product_name}
   Quantity:    ${item.quantity}
   Unit Price:  ${formatRupee(item.unit_price)}
   Total Price: ${formatRupee(item.total_price)}
   ${variationText ? `Details:     ${variationText}` : ""}`;
  }).join("\n\n");

  return `
=========================================
NEW ORDER RECEIVED - ROYAL EPIC INTERIOR
=========================================

Order Number:          #${order.order_number}
Order Date/Time:       ${order.order_date || new Date().toISOString()}
Payment Status:        ${order.payment_status} (Razorpay Verified)

CUSTOMER INFORMATION:
---------------------
Name:                  ${customerName}
Phone:                 ${phone}
Email:                 ${email}
Shipping Address:      ${addressText}

PURCHASED PRODUCTS:
-------------------
${itemsText}

FINANCIAL BREAKDOWN:
--------------------
Subtotal:              ${formatRupee(order.subtotal)}
Discount:              ${order.discount ? `- ${formatRupee(order.discount)}` : "₹0.00"}
Shipping:              ${order.shipping_charge ? formatRupee(order.shipping_charge) : "FREE"}
Tax:                   ${order.tax ? formatRupee(order.tax) : "₹0.00"}
FINAL TOTAL AMOUNT:    ${formatRupee(order.final_total)}

PAYMENT GATEWAY REFERENCES:
---------------------------
Razorpay Order ID:     ${order.razorpay_order_id}
Razorpay Payment ID:   ${order.razorpay_payment_id}
Internal Order ID:     ${order.order_id}

=========================================
Royal Epic Interior & Furniture
No. 169, Anjanadri Badavana, Rachenahalli, 
Thanisandra, Bengaluru, Karnataka 560077
=========================================
`.trim();
}

/**
 * Automatically sends ONE order notification email using the existing Hostinger SMTP.
 * - From: enquiry@royalepicinterior.com
 * - To: enquiry@royalepicinterior.com
 * - Subject: New Order Received - #[ORDER_NUMBER]
 * - Enforces deduplication via order_number & razorpay_payment_id.
 * - Completely fail-safe: failures are logged and returned without throwing.
 */
export async function sendOrderNotificationEmail(
  order: OrderEmailPayload
): Promise<{ success: boolean; skipped?: boolean; error?: string; messageId?: string }> {
  pruneOldOrderDeduplicationEntries();

  const dedupKey = getOrderDedupKey(order);
  const now = Date.now();

  // Deduplication check: in-flight or already dispatched
  if (inFlightOrderDispatches.has(dedupKey)) {
    console.log(`[Hostinger SMTP] Order deduplication: in-flight order dispatch matching key (${dedupKey}), skipping duplicate email.`);
    return { success: true, skipped: true, error: "duplicate_in_flight" };
  }

  const lastSentTime = recentDispatchedOrderEmails.get(dedupKey);
  if (lastSentTime && now - lastSentTime < 24 * 60 * 60 * 1000) {
    console.log(
      `[Hostinger SMTP] Order deduplication: suppressed duplicate email for (#${order.order_number} / ${dedupKey}), sent ${Math.round(
        (now - lastSentTime) / 1000
      )}s ago.`
    );
    return { success: true, skipped: true, error: "duplicate_already_sent" };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Hostinger SMTP] Notice: SMTP_PASS not set. Order notification email skipped safely.");
    return {
      success: false,
      skipped: true,
      error: "SMTP_PASS not configured in server environment.",
    };
  }

  inFlightOrderDispatches.add(dedupKey);

  const senderUser = "enquiry@royalepicinterior.com";
  const receiverEmail = "enquiry@royalepicinterior.com";

  const mailOptions = {
    from: `"Royal Epic Interior" <${senderUser}>`,
    to: receiverEmail,
    replyTo: order.customer_email && order.customer_email.includes("@") 
      ? order.customer_email 
      : senderUser,
    subject: `New Order Received - #${order.order_number}`,
    text: formatOrderEmailText(order),
    html: formatOrderEmailHtml(order),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    recentDispatchedOrderEmails.set(dedupKey, Date.now());
    inFlightOrderDispatches.delete(dedupKey);

    console.log(
      `✅ [Hostinger SMTP] Order notification email delivered successfully for #${order.order_number}! MessageID: ${info.messageId} | Destination: ${receiverEmail}`
    );
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    inFlightOrderDispatches.delete(dedupKey);
    const cleanError = err?.message?.replace(/pass=[^&\s]+/gi, "pass=***") || "SMTP order dispatch error";
    console.error(`⚠️ [Hostinger SMTP] Failed to dispatch order email notification for #${order.order_number}: ${cleanError}`);
    return { success: false, error: cleanError };
  }
}

