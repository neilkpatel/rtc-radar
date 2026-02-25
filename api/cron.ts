import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron call (Vercel sends authorization header)
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  try {
    // Fetch all sources in parallel
    const [ytResp, redditResp, trendsResp] = await Promise.all([
      fetch(`${baseUrl}/api/youtube`).then(r => r.ok ? r.json() : { videos: [] }),
      fetch(`${baseUrl}/api/reddit`).then(r => r.ok ? r.json() : { posts: [] }),
      fetch(`${baseUrl}/api/trends`).then(r => r.ok ? r.json() : { dailyTrends: [], foodTrends: [] }),
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

    if (supabaseUrl && supabaseKey) {
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

    return res.status(200).json({
      success: true,
      youtube: youtubeData.length,
      reddit: redditData.length,
      trends: trendsData.dailyTrends.length,
      filmNow: analysis?.topTrends?.filter((t: any) => t.urgency === "film now").length || 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
