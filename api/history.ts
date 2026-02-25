import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Supabase not configured" });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch recent scans (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: scans, error: scansError } = await supabase
      .from("scans")
      .select("id, created_at, film_now_count, this_week_count, watch_count, analysis")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(28); // 4 scans/day * 7 days

    if (scansError) return res.status(500).json({ error: scansError.message });

    // Fetch recent alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select("*")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    if (alertsError) return res.status(500).json({ error: alertsError.message });

    // Build summary
    const scansSummary = (scans || []).map((s: any) => ({
      id: s.id,
      createdAt: s.created_at,
      filmNow: s.film_now_count,
      thisWeek: s.this_week_count,
      watch: s.watch_count,
      topTrends: s.analysis?.topTrends?.slice(0, 3).map((t: any) => ({
        trend: t.trend,
        urgency: t.urgency,
      })) || [],
    }));

    return res.status(200).json({
      scans: scansSummary,
      alerts: alerts || [],
      totalScans: scans?.length || 0,
      totalAlerts: alerts?.length || 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
