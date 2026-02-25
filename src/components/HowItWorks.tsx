export default function HowItWorks() {
  return (
    <div className="space-y-4">
      <div className="bg-rtc-card border border-rtc-orange/30 rounded-lg p-4">
        <h3 className="text-rtc-orange font-semibold text-sm mb-1">How RTC Radar Works</h3>
        <p className="text-rtc-muted text-xs leading-relaxed">
          RTC Radar scans YouTube, Reddit, and Google Trends to find food content that's gaining traction but hasn't gone viral yet. Each piece of content gets a virality score from 0-100. The AI then synthesizes the top patterns into actionable trends with filming recommendations.
        </p>
      </div>

      {/* YouTube Scoring */}
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-4">
        <h4 className="text-rtc-red font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">YT</span>
          YouTube Scoring (0-100)
        </h4>
        <div className="space-y-3">
          <div>
            <p className="text-rtc-white text-xs font-medium">View/Subscriber Ratio</p>
            <p className="text-rtc-muted text-[11px] leading-relaxed mt-0.5">
              How many views relative to the channel's subscriber count. A video with 50K views from a 10K subscriber channel (5x ratio) is over-performing and likely being pushed by the algorithm.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-rtc-text">
              <p><span className="text-rtc-green">+30 pts</span> — Views are 5x+ subscribers</p>
              <p><span className="text-rtc-orange">+20 pts</span> — Views are 2-5x subscribers</p>
              <p><span className="text-rtc-muted">+10 pts</span> — Views are 1-2x subscribers</p>
            </div>
          </div>
          <div>
            <p className="text-rtc-white text-xs font-medium">Velocity (views per hour)</p>
            <p className="text-rtc-muted text-[11px] leading-relaxed mt-0.5">
              How fast a video is accumulating views. High velocity = algorithm is actively pushing it.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-rtc-text">
              <p><span className="text-rtc-green">+30 pts</span> — Over 1,000 views/hr</p>
              <p><span className="text-rtc-orange">+20 pts</span> — 500-1,000 views/hr</p>
              <p><span className="text-rtc-muted">+10 pts</span> — 100-500 views/hr</p>
            </div>
          </div>
          <div>
            <p className="text-rtc-white text-xs font-medium">Engagement Rate</p>
            <p className="text-rtc-muted text-[11px] leading-relaxed mt-0.5">
              (Likes + comments) / total views. High engagement means people care about the content, not just clicking.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-rtc-text">
              <p><span className="text-rtc-green">+20 pts</span> — Over 8% engagement</p>
              <p><span className="text-rtc-muted">+10 pts</span> — 4-8% engagement</p>
            </div>
          </div>
          <div>
            <p className="text-rtc-white text-xs font-medium">Pre-Viral Sweet Spot (peaks around 25K views)</p>
            <p className="text-rtc-muted text-[11px] leading-relaxed mt-0.5">
              Weighted scoring that peaks around 25K views — the bullseye for pre-viral content. Early enough to beat everyone, real enough to be a signal.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-rtc-text">
              <p><span className="text-rtc-green">+30 pts</span> — 10K-50K views (bullseye)</p>
              <p><span className="text-rtc-green">+20 pts</span> — 3K-10K views (early but real)</p>
              <p><span className="text-rtc-muted">+15 pts</span> — 50K-100K views (still pre-viral)</p>
              <p><span className="text-rtc-orange">-15 pts</span> — 100K-300K views (getting late)</p>
              <p><span className="text-rtc-red">-40 pts</span> — Over 300K views (already viral, too late)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reddit Scoring */}
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-4">
        <h4 className="text-rtc-orange font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">R</span>
          Reddit Scoring (0-100)
        </h4>
        <div className="space-y-3">
          <div>
            <p className="text-rtc-white text-xs font-medium">Upvote Velocity</p>
            <p className="text-rtc-muted text-[11px] leading-relaxed mt-0.5">
              Upvotes per hour since posted. Fast-rising posts indicate organic buzz.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-rtc-text">
              <p><span className="text-rtc-green">+30 pts</span> — Over 100 upvotes/hr</p>
              <p><span className="text-rtc-orange">+20 pts</span> — 50-100 upvotes/hr</p>
              <p><span className="text-rtc-muted">+10 pts</span> — 20-50 upvotes/hr</p>
            </div>
          </div>
          <div>
            <p className="text-rtc-white text-xs font-medium">Upvote Ratio</p>
            <p className="text-rtc-muted text-[11px] leading-relaxed mt-0.5">
              Percentage of votes that are upvotes. High ratio = genuinely good content, not divisive.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-rtc-text">
              <p><span className="text-rtc-green">+15 pts</span> — Over 95% upvoted</p>
              <p><span className="text-rtc-muted">+10 pts</span> — 90-95% upvoted</p>
            </div>
          </div>
          <div>
            <p className="text-rtc-white text-xs font-medium">Comment Engagement</p>
            <p className="text-rtc-muted text-[11px] leading-relaxed mt-0.5">
              Comments relative to score. High comment ratio means people are discussing it, not just upvoting.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-rtc-text">
              <p><span className="text-rtc-green">+15 pts</span> — Comment/score ratio over 10%</p>
            </div>
          </div>
          <div>
            <p className="text-rtc-white text-xs font-medium">Pre-Viral Sweet Spot + Rising Boost</p>
            <p className="text-rtc-muted text-[11px] leading-relaxed mt-0.5">
              Posts with 50-2K upvotes are trending but not front page yet. Under 300 upvotes with high velocity means a post is catching fire — this is the gold.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-rtc-text">
              <p><span className="text-rtc-green">+25 pts</span> — 50-2,000 upvotes (pre-viral)</p>
              <p><span className="text-rtc-green">+25 pts</span> — Under 300 upvotes but 15+ velocity (catching fire)</p>
              <p><span className="text-rtc-orange">-15 pts</span> — 5K-10K upvotes (getting late)</p>
              <p><span className="text-rtc-red">-40 pts</span> — Over 10K upvotes (front page, too late)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-4">
        <h4 className="text-rtc-blue font-semibold text-sm mb-3">Data Sources</h4>
        <div className="space-y-2 text-xs">
          <div>
            <p className="text-rtc-white font-medium">YouTube</p>
            <p className="text-rtc-muted text-[11px]">Searches 12 food queries (food review, restaurant review, food trend, new food, viral food, best restaurants, food challenge, street food, NYC restaurant, Boca Raton food, celebrity chef, mukbang). Fetches video stats + channel subscriber counts. Last 7 days.</p>
          </div>
          <div>
            <p className="text-rtc-white font-medium">Reddit</p>
            <p className="text-rtc-muted text-[11px]">Scans 19 subreddits including food (r/food, r/FoodPorn, r/streetfood, r/Cooking, r/fastfood, r/Pizza, r/burgers, r/tacos, r/ramen, r/sushi) and local markets (r/FoodNYC, r/nyceats, r/Brooklyn, r/SouthFlorida, r/Miami, r/florida). Hot posts from past week.</p>
          </div>
          <div>
            <p className="text-rtc-white font-medium">Google Trends</p>
            <p className="text-rtc-muted text-[11px]">Daily trending searches in the US, filtered for food-related keywords. Catches mainstream breakout moments.</p>
          </div>
          <div>
            <p className="text-rtc-white font-medium">AI Analysis (Claude)</p>
            <p className="text-rtc-muted text-[11px]">All data is sent to Claude AI which identifies patterns across platforms, ranks trends by urgency, and generates content briefs with specific NYC/Boca Raton filming locations.</p>
          </div>
        </div>
      </div>

      {/* Automation */}
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-4">
        <h4 className="text-rtc-green font-semibold text-sm mb-3">Automation</h4>
        <div className="space-y-2 text-xs text-rtc-muted">
          <p><span className="text-rtc-white font-medium">Daily Cron:</span> Scans run automatically at 8am UTC (3am ET) every day</p>
          <p><span className="text-rtc-white font-medium">Email Alerts:</span> When "film now" or "this week" trends are detected, both Neil and RTC get an email with the full brief</p>
          <p><span className="text-rtc-white font-medium">Persistence:</span> All scan results saved to database — come back anytime to see the latest</p>
          <p><span className="text-rtc-white font-medium">Manual Scan:</span> Hit "Scan & Analyze" anytime to run a fresh scan on demand</p>
        </div>
      </div>

      {/* Request Changes */}
      <div className="bg-rtc-card border border-rtc-orange/20 rounded-lg p-4">
        <h4 className="text-rtc-orange font-semibold text-sm mb-2">Want to Change Something?</h4>
        <p className="text-rtc-muted text-[11px] leading-relaxed">
          The scoring weights, data sources, search queries, subreddits, sweet spot ranges, and AI prompts are all configurable. Tell Neil what you want adjusted and we'll update it. Examples: "Weight Reddit higher", "Add r/nyceats subreddit", "Lower the sweet spot to 5K-100K", "Search for 'celebrity chef' on YouTube", "Make the cron run at 6am ET instead".
        </p>
      </div>
    </div>
  );
}
