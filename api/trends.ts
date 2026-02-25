import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Google Trends doesn't have an official API, but we can use the
    // daily trending searches endpoint
    // Fetch daily trending searches (US)
    const trendingUrl = "https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-300&geo=US&ns=15";
    const trendingResp = await fetch(trendingUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://trends.google.com/trending?geo=US",
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
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
