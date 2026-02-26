import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron call (Vercel sends authorization header)
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const errors: string[] = [];

  try {
    // Fetch all sources in parallel
    const [ytResp, redditResp, trendsResp] = await Promise.all([
      fetch(`${baseUrl}/api/youtube`).then(async r => {
        if (!r.ok) { errors.push(`YouTube: ${r.status} ${await r.text().catch(() => "")}`); return { videos: [] }; }
        return r.json();
      }).catch(e => { errors.push(`YouTube: ${e.message}`); return { videos: [] }; }),
      fetch(`${baseUrl}/api/reddit`).then(async r => {
        if (!r.ok) { errors.push(`Reddit: ${r.status} ${await r.text().catch(() => "")}`); return { posts: [] }; }
        return r.json();
      }).catch(e => { errors.push(`Reddit: ${e.message}`); return { posts: [] }; }),
      fetch(`${baseUrl}/api/trends`).then(async r => {
        if (!r.ok) { errors.push(`Trends: ${r.status} ${await r.text().catch(() => "")}`); return { dailyTrends: [], foodTrends: [] }; }
        return r.json();
      }).catch(e => { errors.push(`Trends: ${e.message}`); return { dailyTrends: [], foodTrends: [] }; }),
    ]);

    const youtubeData = ytResp.videos || [];
    const redditData = redditResp.posts || [];
    const trendsData = { dailyTrends: trendsResp.dailyTrends || [], foodTrends: trendsResp.foodTrends || [] };

    // Run AI analysis
    const analysisResp = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeData, redditData, trendsData }),
    });

    let analysis = null;
    if (analysisResp.ok) {
      const data = await analysisResp.json();
      analysis = data.analysis;
    }

    // Store in Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey && (youtubeData.length > 0 || redditData.length > 0)) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const filmNowCount = analysis?.topTrends?.filter((t: any) => t.urgency === "film now").length || 0;
      const thisWeekCount = analysis?.topTrends?.filter((t: any) => t.urgency === "this week").length || 0;
      const watchCount = analysis?.topTrends?.filter((t: any) => t.urgency === "watch").length || 0;

      const { data: scan } = await supabase.from("scans").insert({
        youtube_data: youtubeData,
        reddit_data: redditData,
        trends_data: trendsData,
        analysis,
        film_now_count: filmNowCount,
        this_week_count: thisWeekCount,
        watch_count: watchCount,
      }).select().single();

      // Send alerts if there are urgent trends
      if (filmNowCount > 0 || thisWeekCount > 0) {
        await fetch(`${baseUrl}/api/alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis,
            scanId: scan?.id,
          }),
        });
      }
    }

    // Send error alert if all sources returned nothing
    if (youtubeData.length === 0 && redditData.length === 0 && errors.length > 0) {
      await sendErrorAlert(baseUrl, errors);
    }

    return res.status(200).json({
      success: true,
      baseUrl,
      youtube: youtubeData.length,
      reddit: redditData.length,
      trends: trendsData.dailyTrends.length,
      filmNow: analysis?.topTrends?.filter((t: any) => t.urgency === "film now").length || 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    await sendErrorAlert("(unknown)", [`Cron crashed: ${err.message}`]).catch(() => {});
    return res.status(500).json({ error: err.message });
  }
}

async function sendErrorAlert(baseUrl: string, errors: string[]) {
  try {
    const clientId = process.env.GMAIL_CLIENT_ID || "";
    const clientSecret = process.env.GMAIL_CLIENT_SECRET || "";
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN || "";
    const recipients = (process.env.ALERT_EMAILS || "").split(",").filter(Boolean);
    if (!clientId || !refreshToken || recipients.length === 0) return;

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) return;

    const time = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const subject = `RTC Radar FAILED — ${time}`;
    const body = `RTC Radar cron scan failed.\n\nBase URL: ${baseUrl}\n\nErrors:\n${errors.map(e => `- ${e}`).join("\n")}\n\nCheck: https://22426rtc-radar.vercel.app`;

    const mimeMessage = [`To: ${recipients.join(", ")}`, `Subject: ${subject}`, `MIME-Version: 1.0`, `Content-Type: text/plain; charset="UTF-8"`, ``, body].join("\r\n");
    const encoded = Buffer.from(mimeMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encoded }),
    });
  } catch {
    // If even the error alert fails, we can't do more
  }
}
