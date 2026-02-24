import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Google Trends doesn't have an official API, but we can use the
    // daily trending searches endpoint and the related queries endpoint
    // For now, we'll use the public trending searches endpoint

    // Fetch daily trending searches (US)
    const trendingUrl = "https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-300&geo=US&ns=15";
    const trendingResp = await fetch(trendingUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    let dailyTrends: any[] = [];
    if (trendingResp.ok) {
      const text = await trendingResp.text();
      // Google prepends ")]}'\n" to the response
      const jsonStr = text.replace(/^\)\]\}'\n/, "");
      try {
        const data = JSON.parse(jsonStr);
        const searches = data.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
        dailyTrends = searches.map((s: any) => ({
          keyword: s.title?.query || "",
          traffic: s.formattedTraffic || "",
          articles: (s.articles || []).slice(0, 2).map((a: any) => ({
            title: a.title,
            url: a.url,
            source: a.source,
          })),
          relatedQueries: (s.relatedQueries || []).map((q: any) => q.query),
        }));
      } catch {
        // Parse error
      }
    }

    // Also search for food-specific trends using the explore endpoint
    const foodKeywords = [
      "viral food", "food trend", "new restaurant",
      "best pizza", "ramen", "Nashville hot chicken",
      "birria tacos", "smash burger", "boba",
      "Korean BBQ", "omakase", "food review",
    ];

    // For each keyword, check if it's trending via autocomplete suggest
    const suggestions: { keyword: string; rising: boolean }[] = [];
    for (const kw of foodKeywords) {
      try {
        const suggestUrl = `https://trends.google.com/trends/api/autocomplete/${encodeURIComponent(kw)}?hl=en-US`;
        const suggestResp = await fetch(suggestUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          },
        });
        if (suggestResp.ok) {
          const text = await suggestResp.text();
          const jsonStr = text.replace(/^\)\]\}'\n/, "");
          const data = JSON.parse(jsonStr);
          const topics = data.default?.topics || [];
          for (const topic of topics.slice(0, 3)) {
            suggestions.push({
              keyword: topic.title || kw,
              rising: true,
            });
          }
        }
      } catch {
        continue;
      }
    }

    // Filter daily trends for food-related items
    const foodTerms = [
      "food", "restaurant", "pizza", "burger", "taco", "sushi", "ramen",
      "chicken", "bbq", "steak", "seafood", "noodle", "sandwich", "coffee",
      "brunch", "dessert", "bakery", "chef", "cooking", "recipe", "eat",
      "dining", "menu", "flavor", "sauce", "spicy", "fried", "grilled",
      "vegan", "organic", "fast food", "delivery", "bar", "cafe", "bistro",
      "korean", "mexican", "italian", "japanese", "thai", "indian", "chinese",
      "boba", "matcha", "ice cream", "donut", "bagel", "wing", "fry",
    ];

    const foodRelated = dailyTrends.filter(t => {
      const lower = t.keyword.toLowerCase();
      return foodTerms.some(term => lower.includes(term));
    });

    return res.status(200).json({
      dailyTrends: dailyTrends.slice(0, 20),
      foodTrends: foodRelated,
      foodKeywordSuggestions: suggestions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
