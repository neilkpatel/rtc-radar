import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { youtubeData, redditData, trendsData } = req.body;

  const systemPrompt = `You are a food trend analyst for "Respect the Chain", a food review YouTube/social media channel. The host operates between NYC and Boca Raton, FL.

Your job: Analyze the PROVIDED YouTube and Reddit data to identify food trends gaining momentum. Do NOT invent trends from your own knowledge — every trend MUST be grounded in the actual data provided.

HARD RULES:
1. Every trend MUST have a "sources" array with 1-3 items copied from the provided data
2. Source URLs must be EXACT URLs from the data (YouTube "url" field, Reddit "permalink" field)
3. Source titles must be EXACT titles from the data
4. The "platforms" array must ONLY contain "youtube", "reddit", or "google_trends" — no other values
5. Do NOT make up trends that aren't supported by the provided data
6. For restaurants, recommend SPECIFIC places in NYC or Boca Raton where this trend could be filmed

Output valid JSON with this exact structure:
{
  "summary": "2-3 sentence overview",
  "topTrends": [
    {
      "trend": "Name of the trend",
      "why": "Why this is trending based on the data",
      "urgency": "film now" | "this week" | "watch",
      "platforms": ["youtube", "reddit"],
      "contentBrief": "Video title idea + hook",
      "restaurants": "1-3 specific restaurant names in NYC or Boca Raton with neighborhood",
      "sources": [{"title": "EXACT title from data", "url": "EXACT url from data", "platform": "youtube", "date": "Feb 22"}]
    }
  ]
}

Return 5-8 trends ranked by urgency. Only valid JSON, no other text.`;

  // Add URLs to YouTube data so the AI can reference them
  const ytWithUrls = (youtubeData?.slice(0, 20) || []).map((v: any) => ({
    ...v,
    url: `https://youtube.com/watch?v=${v.id}`,
  }));

  const redditSlice = (redditData?.slice(0, 20) || []);

  const userMessage = `Here's today's data. EVERY trend you identify must reference specific items from this data with their EXACT url and title in the sources array.

YOUTUBE (each has a "url" field — use it in sources):
${JSON.stringify(ytWithUrls, null, 2)}

REDDIT (each has a "permalink" field — use it as the url in sources):
${JSON.stringify(redditSlice, null, 2)}

GOOGLE TRENDS:
${JSON.stringify(trendsData || {}, null, 2)}

Identify 5-8 pre-viral food trends. The host operates in NYC and Boca Raton, FL. Remember: every trend MUST have sources with exact URLs from the data above.`;

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
        max_tokens: 4096,
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

    // Aggressively extract JSON: strip code fences, find the outermost { }
    text = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();

    // Find the first { and last } to extract the JSON object
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      text = text.slice(firstBrace, lastBrace + 1);
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      // Try fixing common JSON issues: trailing commas, control characters
      try {
        const cleaned = text
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .replace(/[\x00-\x1F\x7F]/g, (c) => c === "\n" || c === "\r" || c === "\t" ? c : "");
        analysis = JSON.parse(cleaned);
      } catch {
        // Last resort: return raw text as summary
        return res.status(200).json({
          analysis: {
            summary: "AI analysis completed but response could not be parsed. Please try scanning again.",
            topTrends: [],
            generatedAt: new Date().toISOString(),
            rawResponse: text.slice(0, 200),
          },
        });
      }
    }

    return res.status(200).json({
      analysis: {
        ...analysis,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
