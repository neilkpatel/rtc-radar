import type { TrendAnalysis } from "../lib/types";

function urgencyColor(urgency: string): string {
  switch (urgency) {
    case "film now": return "bg-rtc-red/20 text-rtc-red border-rtc-red/30";
    case "this week": return "bg-rtc-orange/20 text-rtc-orange border-rtc-orange/30";
    case "watch": return "bg-rtc-blue/20 text-rtc-blue border-rtc-blue/30";
    default: return "bg-rtc-card text-rtc-muted border-rtc-border";
  }
}

function platformLabel(p: string): string {
  switch (p) {
    case "youtube": return "YouTube";
    case "reddit": return "Reddit";
    case "google_trends": return "Google";
    default: return p;
  }
}

export default function AnalysisPanel({
  analysis,
  loading,
  onRefresh,
}: {
  analysis: TrendAnalysis | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-rtc-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-rtc-muted text-sm">AI is analyzing trends across platforms...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-6 text-center">
        <p className="text-rtc-muted text-sm mb-3">Click "Scan & Analyze" to have AI analyze current food trends</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-rtc-orange text-white text-sm font-semibold rounded-lg hover:bg-rtc-orange-dim transition-colors"
        >
          Scan & Analyze
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-rtc-card border border-rtc-orange/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-rtc-orange font-semibold text-sm">AI Trend Analysis</h3>
          <div className="flex items-center gap-2">
            <span className="text-rtc-muted text-[10px]">
              {new Date(analysis.generatedAt).toLocaleString()}
            </span>
            <button
              onClick={onRefresh}
              className="text-rtc-muted hover:text-rtc-orange text-xs transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        <p className="text-rtc-text text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Trend Cards */}
      {analysis.topTrends.map((trend, i) => (
        <div key={i} className="bg-rtc-card border border-rtc-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="text-rtc-white font-semibold text-sm">{trend.trend}</h4>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 ${urgencyColor(trend.urgency)}`}>
              {trend.urgency}
            </span>
          </div>
          <p className="text-rtc-muted text-xs leading-relaxed mb-2">{trend.why}</p>

          {/* Content Brief */}
          <div className="bg-rtc-dark rounded p-3 mb-2">
            <span className="text-rtc-orange text-[10px] font-semibold uppercase tracking-wide">Content Brief</span>
            <p className="text-rtc-text text-xs mt-1 leading-relaxed">{trend.contentBrief}</p>
          </div>

          {/* Restaurant recommendations */}
          {trend.restaurants && (
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded p-3 mb-2">
              <span className="text-rtc-green text-[10px] font-semibold uppercase tracking-wide">Where to Film</span>
              <p className="text-rtc-text text-xs mt-1 leading-relaxed">{trend.restaurants}</p>
            </div>
          )}

          {/* Source links - actual content that triggered this trend */}
          {trend.sources && trend.sources.length > 0 && (
            <div className="bg-rtc-dark rounded p-3 mb-2">
              <span className="text-rtc-muted text-[10px] font-semibold uppercase tracking-wide">Sources</span>
              <div className="mt-1.5 space-y-1.5">
                {trend.sources.map((src, si) => (
                  <a
                    key={si}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 group"
                  >
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                      src.platform === "youtube" ? "bg-rtc-red/20 text-rtc-red" :
                      src.platform === "reddit" ? "bg-rtc-orange/20 text-rtc-orange" :
                      "bg-rtc-blue/20 text-rtc-blue"
                    }`}>
                      {src.platform === "youtube" ? "YT" : src.platform === "reddit" ? "R" : "G"}
                    </span>
                    <span className="text-rtc-text text-xs group-hover:text-rtc-orange transition-colors truncate">
                      {src.title}
                    </span>
                    {src.date && (
                      <span className="text-rtc-muted text-[10px] flex-shrink-0">{src.date}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Platform badges */}
          <div className="flex gap-1.5">
            {trend.platforms.map(p => (
              <span key={p} className="text-[10px] text-rtc-muted bg-rtc-dark px-2 py-0.5 rounded">
                {platformLabel(p)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
