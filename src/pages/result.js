import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  defs,
  linearGradient,
  stop
} from "recharts";

export default function Result() {
  const router = useRouter();
  const { query } = router;

  const [results, setResults] = useState({
    wpm: 0,
    accuracy: 0,
    time: 0,
    history: [],
    characterStats: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
    consistency: 0
  });

  useEffect(() => {
    if (query.results) {
      const resultObj = JSON.parse(query.results);
      let history = resultObj.history || [];

      // Ensure first point is at 0s
      if (history.length === 0 || history[0].time > 0) {
        history = [{ time: 0, wpm: 0 }, ...history];
      }

      // Interpolate history so that we have a point for every second
      if (history.length > 1) {
        const filledHistory = [];
        for (let i = 0; i < history.length - 1; i++) {
          const current = history[i];
          const next = history[i + 1];
          filledHistory.push(current);
          const gap = next.time - current.time;
          if (gap > 1) {
            for (let t = current.time + 1; t < next.time; t++) {
              const progress = (t - current.time) / gap;
              const interpolatedWpm = Math.round(current.wpm + (next.wpm - current.wpm) * progress);
              filledHistory.push({ time: t, wpm: interpolatedWpm });
            }
          }
        }
        filledHistory.push(history[history.length - 1]);
        history = filledHistory;
      }

      // Moving average calculation (3-second window)
      const movingAvgWindow = 3;
      const historyWithAvg = history.map((h, idx, arr) => {
        const start = Math.max(0, idx - movingAvgWindow + 1);
        const window = arr.slice(start, idx + 1);
        const avgWpm = Math.round(window.reduce((sum, p) => sum + p.wpm, 0) / window.length);
        return { ...h, avgWpm };
      });

      // Consistency
      const wpmValues = historyWithAvg.map(h => h.wpm);
      let consistency = 0;
      if (wpmValues.length > 0) {
        const avg = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
        const variance = wpmValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / wpmValues.length;
        consistency = Math.round(100 - (Math.sqrt(variance) / avg) * 100);
      }

      setResults({ ...resultObj, history: historyWithAvg, consistency });
    }
  }, [query]);

  const { correct, incorrect, extra, missed } = results.characterStats;
  const peakWpm = results.history.length ? Math.max(...results.history.map(h => h.wpm)) : 0;

  const getDotColor = (wpm) => {
    if (wpm === peakWpm) return "#00FFFF";
    if (wpm >= 0.8 * peakWpm) return "#00FF00";
    if (wpm >= 0.5 * peakWpm) return "#FFD700";
    return "#FF4500";
  };

  const getTickInterval = (time) => {
    if (time <= 15) return 1;
    if (time <= 30) return 1;
    if (time <= 60) return 2;
    if (time <= 120) return 5;
    return 10;
  };

  const tickInterval = getTickInterval(results.time);
  const xTicks = Array.from({ length: Math.ceil(results.time / tickInterval) + 1 }, (_, i) => i * tickInterval);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-6xl font-mono">
            <div className="text-yellow-500">{results.wpm}</div>
            <div className="text-2xl text-gray-500">WPM</div>
          </div>
          <div className="text-6xl font-mono text-right">
            <div className="text-yellow-500">{results.accuracy}%</div>
            <div className="text-2xl text-gray-500">Accuracy</div>
          </div>
        </div>

        {/* WPM Graph with gradient fill */}
        <div className="h-[400px] mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={results.history} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#FFD700" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                domain={[0, results.time]}
                ticks={xTicks}
                tickFormatter={(t) => `${t}s`}
                stroke="#888"
              />
              <YAxis
                stroke="#888"
                domain={[0, Math.max(50, Math.ceil(peakWpm / 10) * 10)]}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#222", border: "none", borderRadius: "4px" }}
                formatter={(value, name) => [`${value}`, name === "wpm" ? "WPM" : "Trend"]}
                labelFormatter={(label) => `Time: ${label}s`}
              />
              {/* Moving average line */}
              <Line
                type="monotone"
                dataKey="avgWpm"
                stroke="#8888FF"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="Trend"
              />
              {/* Main WPM line with gradient fill */}
              <Line
                type="monotone"
                dataKey="wpm"
                stroke="#FFD700"
                strokeWidth={3}
                fill="url(#wpmGradient)"
                fillOpacity={1}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const color = getDotColor(payload.wpm);
                  return <circle cx={cx} cy={cy} r={payload.wpm === peakWpm ? 5 : 3} fill={color} />;
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-4 gap-4 text-center font-mono">
          <div>
            <div className="text-gray-500">Test Time</div>
            <div className="text-yellow-500">{results.time}s</div>
          </div>
          <div>
            <div className="text-gray-500">Raw WPM</div>
            <div className="text-yellow-500">{Math.round(results.wpm * 1.05)}</div>
          </div>
          <div>
            <div className="text-gray-500">Characters</div>
            <div
              className="text-yellow-500 cursor-help"
              title={`Correct: ${correct}\nIncorrect: ${incorrect}\nExtra: ${extra}\nMissed: ${missed}`}
            >
              {correct} / {incorrect} / {extra} / {missed}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Consistency</div>
            <div className="text-yellow-500">{results.consistency}%</div>
          </div>
        </div>

        {/* Play Again */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-500 text-black px-6 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
