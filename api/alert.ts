import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Get fresh access token using refresh token
async function getAccessToken(): Promise<string> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID || "",
      client_secret: process.env.GMAIL_CLIENT_SECRET || "",
      refresh_token: process.env.GMAIL_REFRESH_TOKEN || "",
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error("Failed to refresh Gmail token");
  return data.access_token;
}

// Send email via Gmail API
async function sendGmail(accessToken: string, to: string[], subject: string, html: string) {
  const toHeader = to.map(e => e.trim()).join(", ");

  // RFC 2047 encode subject to handle any non-ASCII characters (trend names, em dashes, etc.)
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;

  const mimeMessage = [
    `To: ${toHeader}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    html,
  ].join("\r\n");

  // Gmail API expects the entire message as base64url
  const encodedMessage = Buffer.from(mimeMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!resp.ok) {
    const error = await resp.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  return resp.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { analysis, scanId } = req.body;
  if (!analysis?.topTrends?.length) return res.status(200).json({ sent: false, reason: "No trends" });

  const recipients = (process.env.ALERT_EMAILS || "").split(",").filter(Boolean);
  if (recipients.length === 0) return res.status(200).json({ sent: false, reason: "No recipients" });

  // Filter to urgent trends only
  const urgentTrends = analysis.topTrends.filter(
    (t: any) => t.urgency === "film now" || t.urgency === "this week"
  );

  if (urgentTrends.length === 0) return res.status(200).json({ sent: false, reason: "No urgent trends" });

  const filmNowCount = urgentTrends.filter((t: any) => t.urgency === "film now").length;
  const thisWeekCount = urgentTrends.filter((t: any) => t.urgency === "this week").length;

  // Build HTML email
  const trendRows = urgentTrends.map((t: any) => {
    const isFilmNow = t.urgency === "film now";
    const urgencyColor = isFilmNow ? "#EF4444" : "#F97316";
    const urgencyBg = isFilmNow ? "#FEE2E2" : "#FFF7ED";
    return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background: ${urgencyBg}; color: ${urgencyColor}; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${t.urgency}</td>
          </tr></table>
          <h3 style="margin: 10px 0 6px 0; color: #111827; font-size: 17px; font-weight: 600;">${t.trend}</h3>
          <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 13px; line-height: 1.6;">${t.why}</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="background: #F9FAFB; border-radius: 8px; padding: 14px;">
            <p style="margin: 0 0 4px 0; color: #F97316; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Content Brief</p>
            <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.6;">${t.contentBrief}</p>
          </td></tr></table>
          ${t.restaurants ? `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 8px;"><tr><td style="background: #F0FDF4; border-radius: 8px; padding: 14px;">
            <p style="margin: 0 0 4px 0; color: #16A34A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Where to Film</p>
            <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.6;">${t.restaurants}</p>
          </td></tr></table>` : ""}
        </td>
      </tr>`;
  }).join("");

  const subjectParts = [];
  if (filmNowCount > 0) subjectParts.push(`${filmNowCount} to FILM NOW`);
  if (thisWeekCount > 0) subjectParts.push(`${thisWeekCount} this week`);
  const subject = `RTC Radar: ${subjectParts.join(" + ")} - ${urgentTrends[0].trend}`;

  const scanTime = new Date().toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F3F4F6;">
    <tr><td align="center" style="padding: 24px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
        <!-- Header -->
        <tr><td style="background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%); border-radius: 12px 12px 0 0; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; color: #F97316; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RTC Radar</h1>
          <p style="margin: 6px 0 0 0; color: #9CA3AF; font-size: 13px;">Respect the Chain — Automated Trend Alert</p>
        </td></tr>
        <!-- Summary -->
        <tr><td style="background: #FFFBEB; padding: 16px 24px; border-bottom: 1px solid #FDE68A;">
          <p style="margin: 0; color: #92400E; font-size: 14px; font-weight: 600;">
            ${filmNowCount > 0 ? `${filmNowCount} trend${filmNowCount > 1 ? "s" : ""} to film NOW` : ""}${filmNowCount > 0 && thisWeekCount > 0 ? " + " : ""}${thisWeekCount > 0 ? `${thisWeekCount} to film this week` : ""}
          </p>
          ${analysis.summary ? `<p style="margin: 8px 0 0 0; color: #78716C; font-size: 13px; line-height: 1.5;">${analysis.summary}</p>` : ""}
        </td></tr>
        <!-- Trends -->
        <tr><td style="background: white;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${trendRows}
          </table>
        </td></tr>
        <!-- CTA -->
        <tr><td style="background: white; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
          <a href="https://22426rtc-radar.vercel.app" style="display: inline-block; background: #F97316; color: white; font-size: 14px; font-weight: 700; padding: 12px 32px; border-radius: 8px; text-decoration: none;">Open Full Dashboard</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background: #F9FAFB; border-radius: 0 0 12px 12px; padding: 16px 24px; text-align: center;">
          <p style="margin: 0; color: #9CA3AF; font-size: 11px;">Automated scan by RTC Radar — ${scanTime} ET</p>
          <p style="margin: 4px 0 0 0; color: #D1D5DB; font-size: 10px;">Sent from neilkpatel@gmail.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const accessToken = await getAccessToken();
    await sendGmail(accessToken, recipients, subject, html);

    // Log alerts in Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      for (const trend of urgentTrends) {
        await supabase.from("alerts").insert({
          scan_id: scanId || null,
          recipients,
          trend_name: trend.trend,
          urgency: trend.urgency,
          content_brief: trend.contentBrief,
          email_sent: true,
        });
      }
    }

    return res.status(200).json({ sent: true, to: recipients, trends: urgentTrends.length });
  } catch (err: any) {
    // Log failed alert
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("alerts").insert({
        recipients,
        trend_name: urgentTrends[0]?.trend || "Unknown",
        urgency: urgentTrends[0]?.urgency || "unknown",
        email_sent: false,
      });
    }
    return res.status(500).json({ error: err.message });
  }
}
