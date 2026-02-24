# RTC Radar

Pre-viral food trend detection tool for Respect the Chain.

**Live:** https://22426rtc-radar.vercel.app
**Password:** `rtc2026`
**Repo:** https://github.com/neilkpatel/rtc-radar

## Tech Stack
- React 19 + TypeScript + Vite 7
- Tailwind CSS 4
- Vercel (serverless functions + hosting)
- Claude API (AI trend analysis)

## Project Structure
```
src/
├── components/
│   ├── PasswordGate.tsx      # Auth screen
│   ├── TrendCard.tsx         # Universal trend item card (YT/Reddit)
│   ├── AnalysisPanel.tsx     # AI analysis display with content briefs
│   └── GoogleTrendsPanel.tsx # Google Trends display
├── lib/
│   └── types.ts              # TypeScript types
├── App.tsx                   # Main app with 4 tabs
├── main.tsx
└── index.css                 # Tailwind + dark theme
api/
├── youtube.ts    # YouTube Data API — search food videos, score virality
├── reddit.ts     # Reddit API — scan food subreddits for rising posts
├── trends.ts     # Google Trends — daily trending searches
└── analyze.ts    # Claude AI — analyze all data, generate content briefs
```

## How It Works
1. "Scan & Analyze" fetches YouTube, Reddit, and Google Trends in parallel
2. Each source scores content for pre-viral potential (engagement velocity, view/subscriber ratio, etc.)
3. All data is sent to Claude which identifies top trends and generates content briefs
4. Content briefs include video title ideas, hooks, and urgency levels (film now / this week / watch)

## API Keys (Vercel Env Vars)
- `ANTHROPIC_API_KEY` — Claude API for AI analysis
- `YOUTUBE_API_KEY` — YouTube Data API v3 (NEEDED — not set yet)

## Context
- The host operates between **NYC** and **Boca Raton, FL**
- Channel: "Respect the Chain" — food reviews, restaurant owner interviews, celebrity food content
- Goal: Identify food trends before they go viral so he can be first to film content

## Roadmap
- [ ] Add YouTube API key (Google Cloud Console → YouTube Data API v3)
- [ ] Add RapidAPI for TikTok/Instagram data (future)
- [ ] Yelp API for new restaurant openings in NYC/Boca
- [ ] Google Maps Places API for trending restaurants
- [ ] Automated cron scans (Vercel Cron — every 6 hours)
- [ ] Email/SMS alerts when pre-viral content detected
- [ ] Historical trend tracking in Supabase
- [ ] Link as Collab 2 on neilkpatel.com portfolio
