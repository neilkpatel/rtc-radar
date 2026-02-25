export type Platform = "youtube" | "reddit" | "google_trends";

export interface TrendItem {
  id: string;
  platform: Platform;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  // Engagement metrics
  views?: number;
  likes?: number;
  comments?: number;
  score?: number; // reddit upvotes
  // Virality
  viralityScore: number; // 0-100, higher = more pre-viral potential
  velocity: number; // engagement per hour since posted
  hoursOld: number;
  // Metadata
  author: string;
  authorFollowers?: number;
  publishedAt: string;
  fetchedAt: string;
  tags: string[];
}

export interface GoogleTrend {
  keyword: string;
  value: number; // 0-100 interest
  formattedValue: string;
  rising: boolean;
  relatedQueries: string[];
}

export interface TrendAnalysis {
  summary: string;
  topTrends: {
    trend: string;
    why: string;
    urgency: "film now" | "this week" | "watch";
    platforms: Platform[];
    contentBrief: string;
    restaurants?: string;
    sources?: { title: string; url: string; platform: string }[];
  }[];
  generatedAt: string;
}

export interface RadarData {
  trendItems: TrendItem[];
  googleTrends: GoogleTrend[];
  analysis: TrendAnalysis | null;
  lastUpdated: string;
}
