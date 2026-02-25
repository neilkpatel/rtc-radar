import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: "RESEND_API_KEY not configured" });

  const { analysis, scanId } = req.body;
  if (!analysis?.topTrends?.length) return res.status(200).json({ sent: false, reason: "No trends" });

  const recipients = (process.env.ALERT_EMAILS || "").split(",").filter(Boolean);
  if (recipients.length === 0) return res.status(200).json({ sent: false, reason: "No recipients" });

  // Filter to urgent trends only
  const urgentTrends = analysis.topTrends.filter(
    (t: any) => t.urgency === "film now" || t.urgency === "this week"
  );

  if (urgentTrends.length === 0) return res.status(200).json({ sent: false, reason: "No urgent trends" });

  // Build HTML email
  const trendRows = urgentTrends.map((t: any) => {
    const urgencyColor = t.urgency === "film now" ? "#EF4444" : "#F97316";
    const urgencyBg = t.urgency === "film now" ? "#FEE2E2" : "#FFF7ED";
    return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="background: ${urgencyBg}; color: ${urgencyColor}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">${t.urgency}</span>
          </div>
          <h3 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">${t.trend}</h3>
          <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 13px; line-height: 1.5;">${t.why}</p>
          <div style="background: #F9FAFB; border-radius: 6px; padding: 12px; margin-top: 8px;">
            <p style="margin: 0; color: #F97316; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Content Brief</p>
            <p style="margin: 4px 0 0 0; color: #374151; font-size: 13px; line-height: 1.5;">${t.contentBrief}</p>
          </div>
          ${t.restaurants ? `
          <div style="background: #F0FDF4; border-radius: 6px; padding: 12px; margin-top: 8px;">
            <p style="margin: 0; color: #16A34A; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Where to Film</p>
            <p style="margin: 4px 0 0 0; color: #374151; font-size: 13px; line-height: 1.5;">${t.restaurants}</p>
          </div>` : ""}
        </td>
      </tr>`;
  }).join("");

  const filmNowCount = urgentTrends.filter((t: any) => t.urgency === "film now").length;
  const thisWeekCount = urgentTrends.filter((t: any) => t.urgency === "this week").length;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background: #0A0A0A; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #F97316; font-size: 22px; font-weight: 700;">RTC Radar Alert</h1>
      <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 13px;">Respect the Chain — Trend Detection</p>
    </div>
    <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
        <strong>${filmNowCount > 0 ? `${filmNowCount} trend${filmNowCount > 1 ? "s" : ""} to film NOW` : ""}${filmNowCount > 0 && thisWeekCount > 0 ? " + " : ""}${thisWeekCount > 0 ? `${thisWeekCount} to film this week` : ""}</strong>
      </p>
      <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 13px;">${analysis.summary || ""}</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${trendRows}
      </table>
      <div style="margin-top: 24px; text-align: center;">
        <a href="https://22426rtc-radar.vercel.app" style="display: inline-block; background: #F97316; color: white; font-size: 14px; font-weight: 600; padding: 10px 24px; border-radius: 8px; text-decoration: none;">View Full Dashboard</a>
      </div>
      <p style="margin: 24px 0 0 0; color: #9CA3AF; font-size: 11px; text-align: center;">Automated scan by RTC Radar — ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "RTC Radar <onboarding@resend.dev>",
        to: recipients,
        subject: `${filmNowCount > 0 ? "FILM NOW" : "This Week"}: ${urgentTrends[0].trend} + ${urgentTrends.length - 1} more trends`,
        html,
      }),
    });

    const emailResult = await emailResp.json();

    // Log alert in Supabase
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
          email_sent: emailResp.ok,
        });
      }
    }

    return res.status(200).json({ sent: emailResp.ok, emailResult });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
