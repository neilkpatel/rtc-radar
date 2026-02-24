import { useState } from "react";

export default function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === "rtc2026") {
      sessionStorage.setItem("rtc_auth", "1");
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-rtc-black flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rtc-orange tracking-tight">RTC Radar</h1>
          <p className="text-rtc-muted text-sm mt-2">Trend detection for Respect the Chain</p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className={`w-full px-4 py-3 bg-rtc-card border rounded-lg text-rtc-white placeholder-rtc-muted focus:outline-none focus:ring-2 transition-all ${
              error
                ? "border-rtc-red focus:ring-rtc-red/30"
                : "border-rtc-border focus:ring-rtc-orange/30"
            }`}
          />
          <button
            type="submit"
            className="w-full py-3 bg-rtc-orange text-white font-semibold rounded-lg hover:bg-rtc-orange-dim transition-colors"
          >
            Enter
          </button>
        </div>
        {error && (
          <p className="text-rtc-red text-sm text-center mt-3">Incorrect password</p>
        )}
      </form>
    </div>
  );
}
