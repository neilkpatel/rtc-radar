import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(200).json({ scan: null });

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find the most recent scan that actually has data
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .or("youtube_data.neq.[],reddit_data.neq.[]")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(200).json({ scan: null });

  return res.status(200).json({
    scan: {
      youtubeData: data.youtube_data || [],
      redditData: data.reddit_data || [],
      trendsData: data.trends_data || {},
      analysis: data.analysis || null,
      createdAt: data.created_at,
    },
  });
}
