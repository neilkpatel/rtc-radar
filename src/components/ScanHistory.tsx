import { useState, useEffect } from "react";

interface ScanSummary {
  id: string;
  createdAt: string;
  filmNow: number;
  thisWeek: number;
  watch: number;
  topTrends: { trend: string; urgency: string }[];
}

interface AlertRecord {
  id: string;
  created_at: string;
  trend_name: string;
  urgency: string;
  content_brief: string;
  email_sent: boolean;
}

function urgencyDot(urgency: string): string {
  switch (urgency) {
    case "film now": return "bg-rtc-red";
    case "this week": return "bg-rtc-orange";
    case "watch": return "bg-rtc-blue";
    default: return "bg-rtc-muted";
  }
}

export default function ScanHistory() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"scans" | "alerts">("scans");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/history");
      if (resp.ok) {
        const data = await resp.json();
        setScans(data.scans || []);
        setAlerts(data.alerts || []);
      }
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="bg-rtc-card border border-rtc-border rounded-lg p-6 text-center">
        <div className="w-5 h-5 border-2 border-rtc-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-rtc-muted text-xs mt-2">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView("scans")}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            activeView === "scans" ? "bg-rtc-orange text-white" : "text-rtc-muted hover:text-rtc-white hover:bg-rtc-card"
          }`}
        >
          Scans ({scans.length})
        </button>
        <button
          onClick={() => setActiveView("alerts")}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            activeView === "alerts" ? "bg-rtc-orange text-white" : "text-rtc-muted hover:text-rtc-white hover:bg-rtc-card"
          }`}
        >
          Alerts ({alerts.length})
        </button>
        <button
          onClick={fetchHistory}
          className="ml-auto text-xs text-rtc-muted hover:text-rtc-orange transition-colors"
        >
          Refresh
        </button>
      </div>

      {activeView === "scans" && (
        <div className="space-y-2">
          {scans.length === 0 && (
            <div className="bg-rtc-card border border-rtc-border rounded-lg p-6 text-center">
              <p className="text-rtc-muted text-xs">No scans yet. Automated scans run every 6 hours.</p>
              <p className="text-rtc-muted text-[10px] mt-1">Manual scans from "Scan & Analyze" will also appear here once tracking is active.</p>
            </div>
          )}
          {scans.map((scan) => (
            <div key={scan.id} className="bg-rtc-card border border-rtc-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-rtc-muted text-[10px]">
                  {new Date(scan.createdAt).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  {scan.filmNow > 0 && (
                    <span className="text-[10px] bg-rtc-red/20 text-rtc-red px-2 py-0.5 rounded">
                      {scan.filmNow} film now
                    </span>
                  )}
                  {scan.thisWeek > 0 && (
                    <span className="text-[10px] bg-rtc-orange/20 text-rtc-orange px-2 py-0.5 rounded">
                      {scan.thisWeek} this week
                    </span>
                  )}
                  {scan.watch > 0 && (
                    <span className="text-[10px] bg-rtc-blue/20 text-rtc-blue px-2 py-0.5 rounded">
                      {scan.watch} watch
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                {scan.topTrends.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDot(t.urgency)}`} />
                    <span className="text-rtc-text text-xs truncate">{t.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeView === "alerts" && (
        <div className="space-y-2">
          {alerts.length === 0 && (
            <div className="bg-rtc-card border border-rtc-border rounded-lg p-6 text-center">
              <p className="text-rtc-muted text-xs">No alerts sent yet.</p>
              <p className="text-rtc-muted text-[10px] mt-1">Alerts are sent when "film now" or "this week" trends are detected during automated scans.</p>
            </div>
          )}
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-rtc-card border border-rtc-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDot(alert.urgency)}`} />
                  <span className="text-rtc-white text-xs font-medium">{alert.trend_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {alert.email_sent ? (
                    <span className="text-[10px] text-rtc-green">sent</span>
                  ) : (
                    <span className="text-[10px] text-rtc-red">failed</span>
                  )}
                  <span className="text-rtc-muted text-[10px]">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              {alert.content_brief && (
                <p className="text-rtc-muted text-[10px] mt-1 pl-3.5">{alert.content_brief}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
