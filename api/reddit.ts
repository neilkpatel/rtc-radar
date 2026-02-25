import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  score: number;
  numComments: number;
  url: string;
  permalink: string;
  thumbnail: string;
  createdUtc: number;
  upvoteRatio: number;
}

const CACHE_HOURS = 3;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabase = getSupabase();

  // Check cache first
  if (supabase) {
    try {
      const { data: cached } = await supabase
        .from("cache")
        .select("data, updated_at")
        .eq("key", "reddit")
        .maybeSingle();

      if (cached?.data && cached.updated_at) {
        const age = (Date.now() - new Date(cached.updated_at).getTime()) / (1000 * 60 * 60);
        if (age < CACHE_HOURS) {
          return res.status(200).json(cached.data);
        }
      }
    } catch { /* cache miss */ }
  }

  try {
    // Use Pullpush.io API (free Reddit mirror, not blocked on cloud IPs)
    const subredditGroups = [
      "food,FoodPorn,streetfood",
      "Cooking,fastfood,restaurant",
      "Pizza,burgers,tacos",
      "ramen,sushi,eatsandwiches,foodhacks",
      "FoodNYC,nyceats,Brooklyn,newyorkcity,AskNYC",
      "SouthFlorida,Miami,florida,fortlauderdale,BocaRaton",
    ];

    const allPosts: RedditPost[] = [];
    const weekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

    for (const group of subredditGroups) {
      try {
        const url = `https://api.pullpush.io/reddit/search/submission/?subreddit=${group}&size=25&sort=desc&sort_type=score&after=${weekAgo}`;
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();

        for (const post of data.data || []) {
          if (!post || post.stickied) continue;

          allPosts.push({
            id: post.id,
            title: post.title || "",
            selftext: (post.selftext || "").slice(0, 300),
            author: post.author || "",
            subreddit: post.subreddit || "",
            score: post.score || 0,
            numComments: post.num_comments || 0,
            url: post.url || "",
            permalink: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
            thumbnail: post.thumbnail?.startsWith("http") ? post.thumbnail : "",
            createdUtc: post.created_utc || 0,
            upvoteRatio: post.upvote_ratio || 0.5,
          });
        }

        await new Promise(r => setTimeout(r, 200));
      } catch {
        continue;
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = allPosts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Score for virality
    const scored = unique.map(p => {
      const hoursOld = (Date.now() / 1000 - p.createdUtc) / 3600;
      const velocity = p.score / Math.max(hoursOld, 1);

      let viralityScore = 0;
      if (velocity > 100) viralityScore += 30;
      else if (velocity > 50) viralityScore += 20;
      else if (velocity > 20) viralityScore += 10;
      if (p.upvoteRatio > 0.95) viralityScore += 15;
      else if (p.upvoteRatio > 0.90) viralityScore += 10;
      const commentRatio = p.numComments / Math.max(p.score, 1);
      if (commentRatio > 0.1) viralityScore += 15;
      if (p.score > 10000) viralityScore -= 40;
      else if (p.score > 5000) viralityScore -= 15;
      if (p.score >= 50 && p.score <= 2000) viralityScore += 25;
      if (p.score < 300 && velocity > 15) viralityScore += 25;
      // Local content boost
      const text = `${p.title} ${p.selftext} ${p.subreddit}`.toLowerCase();
      const localKeywords = ["nyc", "new york", "brooklyn", "manhattan", "queens", "bronx", "harlem", "boca raton", "boca", "miami", "south florida", "fort lauderdale", "delray", "palm beach", "dade"];
      const localSubs = ["foodnyc", "nyceats", "brooklyn", "newyorkcity", "asknyc", "southflorida", "miami", "florida", "fortlauderdale", "bocaraton"];
      if (localKeywords.some(kw => text.includes(kw)) || localSubs.includes(p.subreddit.toLowerCase())) viralityScore += 15;

      return {
        ...p,
        hoursOld: Math.round(hoursOld),
        velocity: Math.round(velocity),
        viralityScore: Math.max(0, Math.min(100, viralityScore)),
      };
    });

    scored.sort((a, b) => b.viralityScore - a.viralityScore);

    const result = { posts: scored.slice(0, 30) };

    // Save to cache
    if (supabase && scored.length > 0) {
      try {
        await supabase
          .from("cache")
          .upsert({ key: "reddit", data: result, updated_at: new Date().toISOString() });
      } catch { /* cache write failed, not critical */ }
    }

    return res.status(200).json(result);
  } catch (err: any) {
    // On error, return stale cache
    if (supabase) {
      try {
        const { data: cached } = await supabase
          .from("cache")
          .select("data")
          .eq("key", "reddit")
          .maybeSingle();
        if (cached?.data) return res.status(200).json(cached.data);
      } catch { /* */ }
    }
    return res.status(500).json({ error: err.message });
  }
}
