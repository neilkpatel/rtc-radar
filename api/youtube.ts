import type { VercelRequest, VercelResponse } from "@vercel/node";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "YOUTUBE_API_KEY not configured" });

  try {
    // Search for recent food/beverage videos
    const queries = [
      "food review",
      "restaurant review",
      "food trend",
      "new food",
      "viral food",
      "best restaurants",
      "food challenge",
      "street food",
      "NYC restaurant",
      "Boca Raton food",
      "celebrity chef",
      "mukbang",
    ];

    const allVideos: YouTubeVideo[] = [];

    for (const query of queries) {
      // Search for videos published in the last 7 days
      const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&maxResults=10&relevanceLanguage=en&key=${apiKey}`;

      const searchResp = await fetch(searchUrl);
      if (!searchResp.ok) continue;
      const searchData = await searchResp.json();

      const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];
      if (videoIds.length === 0) continue;

      // Get video statistics
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}&key=${apiKey}`;
      const statsResp = await fetch(statsUrl);
      if (!statsResp.ok) continue;
      const statsData = await statsResp.json();

      // Get channel subscriber counts
      const channelIds = [...new Set(statsData.items?.map((v: any) => v.snippet.channelId) || [])];
      let channelSubs: Record<string, number> = {};
      if (channelIds.length > 0) {
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(",")}&key=${apiKey}`;
        const channelResp = await fetch(channelUrl);
        if (channelResp.ok) {
          const channelData = await channelResp.json();
          for (const ch of channelData.items || []) {
            channelSubs[ch.id] = parseInt(ch.statistics.subscriberCount) || 0;
          }
        }
      }

      for (const video of statsData.items || []) {
        const views = parseInt(video.statistics.viewCount) || 0;
        const subs = channelSubs[video.snippet.channelId] || 0;

        allVideos.push({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          thumbnail: video.snippet.thumbnails?.medium?.url || "",
          viewCount: views,
          likeCount: parseInt(video.statistics.likeCount) || 0,
          commentCount: parseInt(video.statistics.commentCount) || 0,
          subscriberCount: subs,
        });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = allVideos.filter(v => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    // Score for pre-viral potential
    const scored = unique.map(v => {
      const hoursOld = (Date.now() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60);
      const velocity = v.viewCount / Math.max(hoursOld, 1);

      // Pre-viral = high views relative to subscriber count, from smaller channels
      let viralityScore = 0;
      if (v.subscriberCount > 0) {
        const viewSubRatio = v.viewCount / v.subscriberCount;
        if (viewSubRatio > 5) viralityScore += 30;
        else if (viewSubRatio > 2) viralityScore += 20;
        else if (viewSubRatio > 1) viralityScore += 10;
      }
      // Velocity bonus
      if (velocity > 1000) viralityScore += 30;
      else if (velocity > 500) viralityScore += 20;
      else if (velocity > 100) viralityScore += 10;
      // Engagement ratio
      const engagementRate = (v.likeCount + v.commentCount) / Math.max(v.viewCount, 1);
      if (engagementRate > 0.08) viralityScore += 20;
      else if (engagementRate > 0.04) viralityScore += 10;
      // Already viral = not useful (harsh penalty)
      if (v.viewCount > 300_000) viralityScore -= 40;
      else if (v.viewCount > 100_000) viralityScore -= 15;
      // Weighted pre-viral sweet spot (peaks around 25K)
      if (v.viewCount >= 10000 && v.viewCount <= 50000) viralityScore += 30;      // bullseye
      else if (v.viewCount >= 3000 && v.viewCount < 10000) viralityScore += 20;   // early but real
      else if (v.viewCount > 50000 && v.viewCount <= 100000) viralityScore += 15; // still pre-viral

      return {
        ...v,
        hoursOld: Math.round(hoursOld),
        velocity: Math.round(velocity),
        viralityScore: Math.max(0, Math.min(100, viralityScore)),
      };
    });

    // Sort by virality score
    scored.sort((a, b) => b.viralityScore - a.viralityScore);

    return res.status(200).json({ videos: scored.slice(0, 30) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
