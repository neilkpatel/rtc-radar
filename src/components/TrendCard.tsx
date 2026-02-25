interface TrendCardProps {
  title: string;
  platform: string;
  author: string;
  views?: number;
  score?: number;
  likes?: number;
  comments?: number;
  viralityScore: number;
  velocity: number;
  hoursOld: number;
  url: string;
  thumbnail?: string;
  tags?: string[];
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function platformIcon(platform: string): string {
  switch (platform) {
    case "youtube": return "YT";
    case "reddit": return "R";
    case "google_trends": return "GT";
    default: return "?";
  }
}

function platformColor(platform: string): string {
  switch (platform) {
    case "youtube": return "bg-red-600";
    case "reddit": return "bg-orange-500";
    case "google_trends": return "bg-blue-500";
    default: return "bg-gray-500";
  }
}

function viralityColor(score: number): string {
  if (score >= 70) return "text-rtc-green";
  if (score >= 40) return "text-rtc-yellow";
  return "text-rtc-muted";
}

function viralityBg(score: number): string {
  if (score >= 70) return "bg-rtc-green/10 border-rtc-green/30";
  if (score >= 40) return "bg-rtc-yellow/10 border-rtc-yellow/30";
  return "bg-rtc-card border-rtc-border";
}

export default function TrendCard({
  title,
  platform,
  author,
  views,
  score,
  likes,
  comments,
  viralityScore,
  velocity,
  hoursOld,
  url,
  thumbnail,
}: TrendCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block border rounded-lg p-3 hover:border-rtc-orange/50 transition-colors ${viralityBg(viralityScore)}`}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        {thumbnail && (
          <img
            src={thumbnail}
            alt=""
            className="w-20 h-14 object-cover rounded flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Top row: platform badge + virality score */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={`${platformColor(platform)} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>
                {platformIcon(platform)}
              </span>
              <span className="text-rtc-muted text-[10px]">{author}</span>
            </div>
            <span className={`text-xs font-bold ${viralityColor(viralityScore)}`}>
              {viralityScore}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm text-rtc-white font-medium leading-snug line-clamp-2">
            {title}
          </h3>

          {/* Metrics row */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-rtc-muted">
            {views !== undefined && <span>{fmtNum(views)} views</span>}
            {score !== undefined && <span>{fmtNum(score)} pts</span>}
            {likes !== undefined && likes > 0 && <span>{fmtNum(likes)} likes</span>}
            {comments !== undefined && comments > 0 && <span>{fmtNum(comments)} comments</span>}
            <span>{velocity}/hr</span>
            <span>{hoursOld < 48 ? `${hoursOld}h ago` : `${Math.round(hoursOld / 24)}d ago`}</span>
            <span>{new Date(Date.now() - hoursOld * 3600000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
