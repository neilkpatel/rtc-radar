import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Supabase not configured" });

  const { youtubeData, redditData, trendsData, analysis } = req.body;

  // Don't save empty scans — they overwrite good data
  if ((!youtubeData || youtubeData.length === 0) && (!redditData || redditData.length === 0)) {
    return res.status(200).json({ saved: false, reason: "no data to save" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const filmNowCount = analysis?.topTrends?.filter((t: any) => t.urgency === "film now").length || 0;
  const thisWeekCount = analysis?.topTrends?.filter((t: any) => t.urgency === "this week").length || 0;
  const watchCount = analysis?.topTrends?.filter((t: any) => t.urgency === "watch").length || 0;

  const { error } = await supabase.from("scans").insert({
    youtube_data: youtubeData || [],
    reddit_data: redditData || [],
    trends_data: trendsData || {},
    analysis: analysis || null,
    film_now_count: filmNowCount,
    this_week_count: thisWeekCount,
    watch_count: watchCount,
  });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ saved: true });
}
