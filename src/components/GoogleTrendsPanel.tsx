interface GoogleTrendsPanelProps {
  dailyTrends: any[];
  foodTrends: any[];
  loading: boolean;
}

export default function GoogleTrendsPanel({ dailyTrends, foodTrends, loading }: GoogleTrendsPanelProps) {
  if (loading) {
    return (
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-6 text-center">
        <div className="w-5 h-5 border-2 border-rtc-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-rtc-muted text-xs mt-2">Loading Google Trends...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Food-specific trends */}
      {foodTrends.length > 0 && (
        <div className="bg-rtc-card border border-rtc-border rounded-lg p-4">
          <h3 className="text-rtc-blue font-semibold text-sm mb-3">Food-Related Trending Searches</h3>
          <div className="space-y-2">
            {foodTrends.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-rtc-border last:border-0">
                <div>
                  <span className="text-rtc-white text-xs font-medium">{t.keyword}</span>
                  {t.articles?.[0] && (
                    <a
                      href={t.articles[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-rtc-muted text-[10px] hover:text-rtc-blue truncate max-w-xs"
                    >
                      {t.articles[0].title}
                    </a>
                  )}
                </div>
                <span className="text-rtc-green text-xs font-medium flex-shrink-0">{t.traffic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All daily trends */}
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-4">
        <h3 className="text-rtc-blue font-semibold text-sm mb-3">
          All Daily Trending Searches
          <span className="text-rtc-muted text-[10px] font-normal ml-2">
            (scan for food angles)
          </span>
        </h3>
        <div className="space-y-1.5">
          {dailyTrends.map((t: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-rtc-border/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-rtc-muted text-[10px] w-5">{i + 1}</span>
                <span className="text-rtc-text text-xs">{t.keyword}</span>
              </div>
              <span className="text-rtc-muted text-[10px]">{t.traffic}</span>
            </div>
          ))}
          {dailyTrends.length === 0 && (
            <p className="text-rtc-muted text-xs text-center py-4">No daily trends loaded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
