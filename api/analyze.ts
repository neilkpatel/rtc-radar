import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { youtubeData, redditData, trendsData } = req.body;

  const systemPrompt = `You are a food trend analyst for "Respect the Chain", a food review YouTube/social media channel. The host interviews restaurant owners, celebrities, and tries their food. He operates between NYC and Boca Raton, FL.

Your job: Analyze data from YouTube, Reddit, and Google Trends to identify food/beverage trends that are gaining momentum but haven't gone fully viral yet. The goal is to make content BEFORE a trend peaks.

IMPORTANT RULES:
- Be specific. Name actual foods, cuisines, dishes, or restaurants when possible.
- Give actionable advice: "Film a video about X this week because Y"
- Prioritize trends that would make good video content for a food review channel
- Consider NYC and Boca Raton / South Florida specifically
- Focus on the "pre-viral window" — things at 10K-100K engagement that could hit millions
- Include a content brief for each top trend: title idea, hook, and why viewers would care

Output your analysis as valid JSON with this exact structure:
{
  "summary": "2-3 sentence overview of the current food trend landscape",
  "topTrends": [
    {
      "trend": "Name of the trend",
      "why": "Why this is trending and why it matters for content",
      "urgency": "film now" | "this week" | "watch",
      "platforms": ["youtube", "reddit", "google_trends"],
      "contentBrief": "Video title idea + 1-2 sentence hook for the video"
    }
  ]
}

Return 5-8 trends, ranked by urgency and content potential. Only valid JSON, no other text.`;

  const userMessage = `Here's today's data from our trend scanning:

YOUTUBE (top food videos gaining traction):
${JSON.stringify(youtubeData?.slice(0, 15) || [], null, 2)}

REDDIT (trending food posts):
${JSON.stringify(redditData?.slice(0, 15) || [], null, 2)}

GOOGLE TRENDS:
${JSON.stringify(trendsData || {}, null, 2)}

Analyze these signals and identify the top pre-viral food trends. Remember: the host operates in NYC and Boca Raton, FL.`;

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
        max_tokens: 2048,
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

    // Strip markdown code fences if present (```json ... ```)
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    // Parse the JSON response
    try {
      const analysis = JSON.parse(text);
      return res.status(200).json({
        analysis: {
          ...analysis,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch {
      return res.status(200).json({
        analysis: {
          summary: text,
          topTrends: [],
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
