import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { analysis, youtubeData, redditData } = req.body;

  const systemPrompt = `You are a content strategist for "Respect the Chain", a food review YouTube/social media channel. The host interviews restaurant owners, celebrities, and tries their food. He operates between NYC and Boca Raton, FL.

Generate a 7-day content calendar based on current food trend data. Each day should have:
- A specific video concept
- Where to film (specific restaurant/location in NYC or Boca Raton)
- Why this content is timely
- Estimated filming time
- Platform priority (which platform to post first)

Output valid JSON with this structure:
{
  "weekOf": "Feb 24 - Mar 2, 2026",
  "overview": "1-2 sentence strategy overview for the week",
  "days": [
    {
      "day": "Monday",
      "date": "Feb 24",
      "concept": "Video title/concept",
      "location": "Specific restaurant or area in NYC/Boca",
      "why": "Why this is timely and will perform well",
      "filmingTime": "2-3 hours",
      "platforms": ["youtube", "tiktok", "instagram"],
      "priority": "high" | "medium" | "low",
      "trendConnection": "Which detected trend this connects to"
    }
  ],
  "bonusIdeas": [
    {
      "concept": "Extra video idea if time allows",
      "why": "Brief reasoning"
    }
  ]
}

Only return valid JSON. No other text.`;

  const userMessage = `Based on the latest trend scan data, create a content calendar for this week:

DETECTED TRENDS:
${JSON.stringify(analysis?.topTrends?.slice(0, 8) || [], null, 2)}

TRENDING YOUTUBE VIDEOS:
${JSON.stringify((youtubeData || []).slice(0, 10).map((v: any) => ({ title: v.title, views: v.viewCount, channel: v.channelTitle })), null, 2)}

TRENDING REDDIT POSTS:
${JSON.stringify((redditData || []).slice(0, 10).map((p: any) => ({ title: p.title, score: p.score, subreddit: p.subreddit })), null, 2)}

Create a content calendar for this week. Be specific with NYC and Boca Raton restaurant/location recommendations.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    let text = data.content?.[0]?.text || "{}";
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    try {
      const calendar = JSON.parse(text);
      return res.status(200).json({ calendar });
    } catch {
      return res.status(200).json({ calendar: { overview: text, days: [], bonusIdeas: [] } });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
