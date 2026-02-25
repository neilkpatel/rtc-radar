import { useState } from "react";

interface CalendarDay {
  day: string;
  date: string;
  concept: string;
  location: string;
  why: string;
  filmingTime: string;
  platforms: string[];
  priority: "high" | "medium" | "low";
  trendConnection: string;
}

interface CalendarData {
  weekOf: string;
  overview: string;
  days: CalendarDay[];
  bonusIdeas: { concept: string; why: string }[];
}

function priorityColor(p: string): string {
  switch (p) {
    case "high": return "bg-rtc-red/20 text-rtc-red border-rtc-red/30";
    case "medium": return "bg-rtc-orange/20 text-rtc-orange border-rtc-orange/30";
    case "low": return "bg-rtc-blue/20 text-rtc-blue border-rtc-blue/30";
    default: return "bg-rtc-card text-rtc-muted border-rtc-border";
  }
}

function platformIcon(p: string): string {
  switch (p) {
    case "youtube": return "YT";
    case "tiktok": return "TT";
    case "instagram": return "IG";
    case "twitter": return "X";
    default: return p.slice(0, 2).toUpperCase();
  }
}

export default function ContentCalendar({
  analysis,
  youtubeData,
  redditData,
}: {
  analysis: any;
  youtubeData: any[];
  redditData: any[];
}) {
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateCalendar = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, youtubeData, redditData }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setCalendar(data.calendar);
      }
    } catch { /* */ }
    setLoading(false);
  };

  if (!calendar && !loading) {
    return (
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-6 text-center">
        <h3 className="text-rtc-white font-semibold text-sm mb-2">Content Calendar</h3>
        <p className="text-rtc-muted text-xs mb-4">
          {analysis ? "Generate a 7-day filming plan based on current trends" : "Run a scan first, then generate your content calendar"}
        </p>
        <button
          onClick={generateCalendar}
          disabled={!analysis}
          className="px-4 py-2 bg-rtc-orange text-white text-sm font-semibold rounded-lg hover:bg-rtc-orange-dim transition-colors disabled:opacity-40"
        >
          Generate Calendar
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-rtc-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-rtc-muted text-sm">AI is building your content calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-rtc-card border border-rtc-orange/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-rtc-orange font-semibold text-sm">Content Calendar — {calendar?.weekOf}</h3>
          <button
            onClick={generateCalendar}
            className="text-rtc-muted hover:text-rtc-orange text-xs transition-colors"
          >
            Regenerate
          </button>
        </div>
        <p className="text-rtc-text text-sm leading-relaxed">{calendar?.overview}</p>
      </div>

      {/* Days */}
      {calendar?.days.map((day, i) => (
        <div key={i} className="bg-rtc-card border border-rtc-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-rtc-orange font-bold text-xs">{day.day}</span>
              <span className="text-rtc-muted text-[10px]">{day.date}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 ${priorityColor(day.priority)}`}>
              {day.priority}
            </span>
          </div>

          <h4 className="text-rtc-white font-semibold text-sm mb-1">{day.concept}</h4>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <span className="text-rtc-muted text-[10px] uppercase tracking-wide">Location</span>
              <p className="text-rtc-green text-xs">{day.location}</p>
            </div>
            <div>
              <span className="text-rtc-muted text-[10px] uppercase tracking-wide">Filming Time</span>
              <p className="text-rtc-text text-xs">{day.filmingTime}</p>
            </div>
          </div>

          <p className="text-rtc-muted text-xs leading-relaxed mb-2">{day.why}</p>

          {day.trendConnection && (
            <p className="text-rtc-blue text-[10px] mb-2">Trend: {day.trendConnection}</p>
          )}

          <div className="flex gap-1">
            {day.platforms.map(p => (
              <span key={p} className="text-[10px] text-rtc-muted bg-rtc-dark px-2 py-0.5 rounded">
                {platformIcon(p)}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Bonus Ideas */}
      {calendar?.bonusIdeas && calendar.bonusIdeas.length > 0 && (
        <div className="bg-rtc-card border border-rtc-border rounded-lg p-4">
          <h3 className="text-rtc-green font-semibold text-xs uppercase tracking-wide mb-3">Bonus Ideas</h3>
          <div className="space-y-2">
            {calendar.bonusIdeas.map((idea, i) => (
              <div key={i} className="border-b border-rtc-border/50 last:border-0 pb-2 last:pb-0">
                <p className="text-rtc-white text-xs font-medium">{idea.concept}</p>
                <p className="text-rtc-muted text-[10px]">{idea.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
