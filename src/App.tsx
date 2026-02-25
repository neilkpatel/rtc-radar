import { useState, useCallback } from "react";
import PasswordGate from "./components/PasswordGate";
import TrendCard from "./components/TrendCard";
import AnalysisPanel from "./components/AnalysisPanel";
import GoogleTrendsPanel from "./components/GoogleTrendsPanel";
import ContentCalendar from "./components/ContentCalendar";
import ScanHistory from "./components/ScanHistory";
import type { TrendAnalysis } from "./lib/types";

type Tab = "analysis" | "youtube" | "reddit" | "trends" | "calendar" | "history";

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("rtc_auth") === "1");
  const [activeTab, setActiveTab] = useState<Tab>("analysis");

  // Data state
  const [youtubeData, setYoutubeData] = useState<any[]>([]);
  const [redditData, setRedditData] = useState<any[]>([]);
  const [trendsData, setTrendsData] = useState<{ dailyTrends: any[]; foodTrends: any[] }>({ dailyTrends: [], foodTrends: [] });
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);

  // Loading states
  const [loadingYT, setLoadingYT] = useState(false);
  const [loadingReddit, setLoadingReddit] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Scan progress messages
  const [scanStatus, setScanStatus] = useState("");

  const fetchYouTube = useCallback(async () => {
    setLoadingYT(true);
    try {
      const resp = await fetch("/api/youtube");
      if (resp.ok) {
        const data = await resp.json();
        setYoutubeData(data.videos || []);
        return data.videos || [];
      }
    } catch { /* */ }
    setLoadingYT(false);
    return [];
  }, []);

  const fetchReddit = useCallback(async () => {
    setLoadingReddit(true);
    try {
      const resp = await fetch("/api/reddit");
      if (resp.ok) {
        const data = await resp.json();
        setRedditData(data.posts || []);
        return data.posts || [];
      }
    } catch { /* */ }
    setLoadingReddit(false);
    return [];
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const resp = await fetch("/api/trends");
      if (resp.ok) {
        const data = await resp.json();
        setTrendsData({
          dailyTrends: data.dailyTrends || [],
          foodTrends: data.foodTrends || [],
        });
        setLoadingTrends(false);
        return data;
      }
    } catch { /* */ }
    setLoadingTrends(false);
    return {};
  }, []);

  const runAnalysis = useCallback(async (yt: any[], reddit: any[], trends: any) => {
    setLoadingAnalysis(true);
    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeData: yt,
          redditData: reddit,
          trendsData: trends,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setAnalysis(data.analysis);
      }
    } catch { /* */ }
    setLoadingAnalysis(false);
  }, []);

  // Full scan: fetch all sources then run AI analysis
  const handleFullScan = useCallback(async () => {
    setScanning(true);
    setActiveTab("analysis");
    setScanStatus("Scanning YouTube, Reddit, and Google Trends...");

    // Fetch all sources in parallel
    const [yt, reddit, trends] = await Promise.all([
      fetchYouTube(),
      fetchReddit(),
      fetchTrends(),
    ]);

    setLoadingYT(false);
    setLoadingReddit(false);

    setScanStatus("Running AI analysis...");

    // Run AI analysis on the results
    await runAnalysis(yt, reddit, trends);
    setScanStatus("");
    setScanning(false);
  }, [fetchYouTube, fetchReddit, fetchTrends, runAnalysis]);

  if (!authed) {
    return <PasswordGate onUnlock={() => setAuthed(true)} />;
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "analysis", label: "AI Analysis" },
    { key: "youtube", label: "YouTube", count: youtubeData.length },
    { key: "reddit", label: "Reddit", count: redditData.length },
    { key: "trends", label: "Google Trends" },
    { key: "calendar", label: "Calendar" },
    { key: "history", label: "History" },
  ];

  return (
    <div className="min-h-screen bg-rtc-black text-rtc-text">
      {/* Header */}
      <header className="border-b border-rtc-border px-4 py-3 sticky top-0 z-30 bg-rtc-black/95 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-rtc-orange tracking-tight">RTC Radar</h1>
            <span className="text-rtc-muted text-xs hidden md:inline">Respect the Chain — Trend Detection</span>
          </div>
          <div className="flex items-center gap-3">
            {scanning && scanStatus && (
              <span className="text-rtc-muted text-[10px] hidden sm:inline animate-pulse">{scanStatus}</span>
            )}
            <button
              onClick={handleFullScan}
              disabled={scanning}
              className="px-4 py-2 bg-rtc-orange text-white text-xs font-semibold rounded-lg hover:bg-rtc-orange-dim transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {scanning && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {scanning ? "Scanning..." : "Scan & Analyze"}
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === t.key
                  ? "bg-rtc-orange text-white"
                  : "text-rtc-muted hover:text-rtc-white hover:bg-rtc-card"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? "bg-white/20" : "bg-rtc-border"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Scan Progress Banner */}
      {scanning && (
        <div className="bg-rtc-orange/10 border-b border-rtc-orange/20 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-rtc-orange border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-3 text-xs">
                <span className={loadingYT ? "text-rtc-orange" : youtubeData.length > 0 ? "text-rtc-green" : "text-rtc-muted"}>
                  {loadingYT ? "YouTube..." : youtubeData.length > 0 ? `YouTube ${youtubeData.length}` : "YouTube"}
                </span>
                <span className={loadingReddit ? "text-rtc-orange" : redditData.length > 0 ? "text-rtc-green" : "text-rtc-muted"}>
                  {loadingReddit ? "Reddit..." : redditData.length > 0 ? `Reddit ${redditData.length}` : "Reddit"}
                </span>
                <span className={loadingTrends ? "text-rtc-orange" : trendsData.dailyTrends.length > 0 ? "text-rtc-green" : "text-rtc-muted"}>
                  {loadingTrends ? "Trends..." : trendsData.dailyTrends.length > 0 ? `Trends ${trendsData.dailyTrends.length}` : "Trends"}
                </span>
                <span className={loadingAnalysis ? "text-rtc-orange" : "text-rtc-muted"}>
                  {loadingAnalysis ? "AI Analyzing..." : "AI Analysis"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {activeTab === "analysis" && (
          <AnalysisPanel
            analysis={analysis}
            loading={loadingAnalysis}
            onRefresh={handleFullScan}
          />
        )}

        {activeTab === "youtube" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-rtc-white">
                YouTube — Pre-Viral Food Videos
              </h2>
              <button
                onClick={fetchYouTube}
                disabled={loadingYT}
                className="text-xs text-rtc-muted hover:text-rtc-orange transition-colors"
              >
                {loadingYT ? "Loading..." : "Refresh"}
              </button>
            </div>
            {youtubeData.length === 0 && !loadingYT && (
              <p className="text-rtc-muted text-xs text-center py-8">
                Click "Scan & Analyze" to fetch YouTube data
              </p>
            )}
            {loadingYT && youtubeData.length === 0 && (
              <div className="text-center py-8">
                <div className="w-5 h-5 border-2 border-rtc-red border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-rtc-muted text-xs mt-2">Searching YouTube...</p>
              </div>
            )}
            <div className="grid gap-2">
              {youtubeData.map((v: any) => (
                <TrendCard
                  key={v.id}
                  title={v.title}
                  platform="youtube"
                  author={v.channelTitle}
                  views={v.viewCount}
                  likes={v.likeCount}
                  comments={v.commentCount}
                  viralityScore={v.viralityScore}
                  velocity={v.velocity}
                  hoursOld={v.hoursOld}
                  url={`https://youtube.com/watch?v=${v.id}`}
                  thumbnail={v.thumbnail}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "reddit" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-rtc-white">
                Reddit — Trending Food Posts
              </h2>
              <button
                onClick={fetchReddit}
                disabled={loadingReddit}
                className="text-xs text-rtc-muted hover:text-rtc-orange transition-colors"
              >
                {loadingReddit ? "Loading..." : "Refresh"}
              </button>
            </div>
            {redditData.length === 0 && !loadingReddit && (
              <p className="text-rtc-muted text-xs text-center py-8">
                Click "Scan & Analyze" to fetch Reddit data
              </p>
            )}
            {loadingReddit && redditData.length === 0 && (
              <div className="text-center py-8">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-rtc-muted text-xs mt-2">Searching Reddit...</p>
              </div>
            )}
            <div className="grid gap-2">
              {redditData.map((p: any) => (
                <TrendCard
                  key={p.id}
                  title={p.title}
                  platform="reddit"
                  author={`r/${p.subreddit}`}
                  score={p.score}
                  comments={p.numComments}
                  viralityScore={p.viralityScore}
                  velocity={p.velocity}
                  hoursOld={p.hoursOld}
                  url={p.permalink}
                  thumbnail={p.thumbnail || undefined}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <GoogleTrendsPanel
            dailyTrends={trendsData.dailyTrends}
            foodTrends={trendsData.foodTrends}
            loading={loadingTrends}
          />
        )}

        {activeTab === "calendar" && (
          <ContentCalendar
            analysis={analysis}
            youtubeData={youtubeData}
            redditData={redditData}
          />
        )}

        {activeTab === "history" && (
          <ScanHistory />
        )}
      </main>
    </div>
  );
}
