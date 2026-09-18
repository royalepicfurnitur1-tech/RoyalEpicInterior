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
