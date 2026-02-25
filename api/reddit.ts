import type { VercelRequest, VercelResponse } from "@vercel/node";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Use multi-subreddit queries to reduce request count (Reddit rate-limits aggressively)
    const subredditGroups = [
      // National food
      "food+FoodPorn+streetfood",
      "Cooking+fastfood+restaurant",
      "Pizza+burgers+tacos",
      "ramen+sushi+eatsandwiches+foodhacks",
      // NYC local
      "FoodNYC+nyceats+Brooklyn+newyorkcity+AskNYC",
      // South Florida local
      "SouthFlorida+Miami+florida+fortlauderdale+BocaRaton",
    ];

    const allPosts: RedditPost[] = [];

    for (const group of subredditGroups) {
      try {
        // Fetch hot posts from each group (combined subreddit query)
        const url = `https://www.reddit.com/r/${group}/hot.json?limit=25&t=week`;
        const resp = await fetch(url, {
          headers: { "User-Agent": "RTCRadarBot/1.0 (food trend analysis tool)" },
        });
        if (!resp.ok) continue;
        const data = await resp.json();

        for (const item of data.data?.children || []) {
          const post = item.data;
          if (!post || post.stickied) continue;

          allPosts.push({
            id: post.id,
            title: post.title,
            selftext: (post.selftext || "").slice(0, 300),
            author: post.author,
            subreddit: post.subreddit,
            score: post.score,
            numComments: post.num_comments,
            url: post.url,
            permalink: `https://reddit.com${post.permalink}`,
            thumbnail: post.thumbnail?.startsWith("http") ? post.thumbnail : "",
            createdUtc: post.created_utc,
            upvoteRatio: post.upvote_ratio,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch {
        // Skip failed groups
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
      // Upvote velocity (score per hour)
      if (velocity > 100) viralityScore += 30;
      else if (velocity > 50) viralityScore += 20;
      else if (velocity > 20) viralityScore += 10;
      // High upvote ratio = genuine engagement
      if (p.upvoteRatio > 0.95) viralityScore += 15;
      else if (p.upvoteRatio > 0.90) viralityScore += 10;
      // Comment engagement
      const commentRatio = p.numComments / Math.max(p.score, 1);
      if (commentRatio > 0.1) viralityScore += 15;
      // Already front page = too late (harsh penalty)
      if (p.score > 10000) viralityScore -= 40;
      else if (p.score > 5000) viralityScore -= 15;
      // Pre-viral sweet spot: 50-2K upvotes
      if (p.score >= 50 && p.score <= 2000) viralityScore += 25;
      // Rising posts get a boost — this is the gold
      if (p.score < 300 && velocity > 15) viralityScore += 25;
      // Local content boost — NYC and South Florida get priority
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

    return res.status(200).json({ posts: scored.slice(0, 30) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
