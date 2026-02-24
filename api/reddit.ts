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
    const subreddits = [
      "food",
      "FoodPorn",
      "streetfood",
      "foodhacks",
      "Cooking",
      "fastfood",
      "restaurant",
      "eatsandwiches",
      "Pizza",
      "burgers",
      "tacos",
      "ramen",
      "sushi",
    ];

    const allPosts: RedditPost[] = [];

    for (const sub of subreddits) {
      try {
        // Fetch hot + rising posts from each subreddit
        for (const sort of ["hot", "rising"]) {
          const url = `https://www.reddit.com/r/${sub}/${sort}.json?limit=15&t=week`;
          const resp = await fetch(url, {
            headers: { "User-Agent": "RTCRadar/1.0" },
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
        }
      } catch {
        // Skip failed subreddits
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
      // Sweet spot: gaining traction but not front page yet
      if (p.score >= 100 && p.score <= 5000) viralityScore += 20;
      // Rising posts get a boost
      if (p.score < 500 && velocity > 30) viralityScore += 20;

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
