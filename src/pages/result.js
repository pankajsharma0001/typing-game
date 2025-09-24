import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Result() {
  const router = useRouter();
  const { query } = router;
  const [results, setResults] = useState({
    wpm: 0,
    accuracy: 0,
    time: 0,
    score: 0,
    history: [],
    characterStats: {},
    consistency: 0
  });

  const getCharacterStats = () => {
    return {
      correct: results.characterStats?.correct || 0,
      incorrect: results.characterStats?.incorrect || 0,
      extra: results.characterStats?.extra || 0,
      missed: results.characterStats?.missed || 0
    };
  };

  useEffect(() => {
    if (query.results) {
      const resultObj = JSON.parse(query.results);
      
      // Ensure history starts from 0 and has all points
      let fullHistory = resultObj.history || [];
      
      // Add 0 WPM point at start if not present
      if (fullHistory.length > 0 && fullHistory[0].time > 0) {
        fullHistory = [{ time: 0, wpm: 0, isMark: true }, ...fullHistory];
      }

      // Fill in gaps between points (every 2 seconds)
      const filledHistory = [];
      for (let i = 0; i < fullHistory.length - 1; i++) {
        filledHistory.push(fullHistory[i]);
        const current = fullHistory[i];
        const next = fullHistory[i + 1];
        const gap = next.time - current.time;
        
        if (gap > 2) {
          // Interpolate points between gaps
          for (let t = current.time + 2; t < next.time; t += 2) {
            const progress = (t - current.time) / gap;
            const interpolatedWpm = Math.round(
              current.wpm + (next.wpm - current.wpm) * progress
            );
            filledHistory.push({
              time: t,
              wpm: interpolatedWpm,
              isMark: t % 5 === 0
            });
          }
        }
      }
      if (fullHistory.length > 0) {
        filledHistory.push(fullHistory[fullHistory.length - 1]);
      }

      // Calculate consistency
      const nonZeroWpm = filledHistory.filter(h => h.wpm > 0).map(h => h.wpm);
      let consistency = 0;
      if (nonZeroWpm.length > 0) {
        const avgWpm = nonZeroWpm.reduce((a, b) => a + b, 0) / nonZeroWpm.length;
        const variance = nonZeroWpm.reduce((a, b) => a + Math.pow(b - avgWpm, 2), 0) / nonZeroWpm.length;
        consistency = Math.round(100 - (Math.sqrt(variance) / avgWpm * 100));
      }

      setResults({
        ...resultObj,
        history: filledHistory,
        consistency
      });
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-6xl font-mono">
            <div className="text-yellow-500">{results.wpm}</div>
            <div className="text-2xl text-gray-500">wpm</div>
          </div>
          <div className="text-6xl font-mono text-right">
            <div className="text-yellow-500">{results.accuracy}%</div>
            <div className="text-2xl text-gray-500">acc</div>
          </div>
        </div>

        {/* Graph */}
        <div className="h-[300px] mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={results.history}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="time"
                type="number"
                stroke="#666"
                tickFormatter={(value) => `${value}s`}
                domain={[0, 'dataMax']}
                allowDecimals={false}
                ticks={(() => {
                  const interval = results.time <= 30 ? 1 : // 1s interval for ≤30s
                                  results.time <= 60 ? 2 : // 2s interval for ≤60s
                                  results.time <= 120 ? 5 : // 5s interval for ≤120s
                                  10; // 10s interval for >120s
                  return Array.from(
                    { length: Math.ceil(results.time / interval) + 1 },
                    (_, i) => i * interval
                  );
                })()}
              />
              <YAxis
                stroke="#666"
                domain={[0, Math.max(100, Math.ceil(Math.max(...results.history.map(h => h.wpm)) / 10) * 10)]}
                allowDecimals={false}
                ticks={Array.from(
                  { length: 11 },
                  (_, i) => i * Math.ceil(Math.max(...results.history.map(h => h.wpm)) / 10)
                )}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px"
                }}
                formatter={(value) => [`${value} wpm`, "Speed"]}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="wpm"
                stroke="#FFD700"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const interval = results.time <= 30 ? 5 : // Mark every 5s for ≤30s
                                  results.time <= 60 ? 10 : // Mark every 10s for ≤60s
                                  results.time <= 120 ? 15 : // Mark every 15s for ≤120s
                                  30; // Mark every 30s for >120s
                  return payload.time % interval === 0 ? (
                    <circle cx={cx} cy={cy} r={2} fill="#FFD700" />
                  ) : null;
                }}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-4 gap-4 text-center font-mono">
          <div>
            <div className="text-gray-500">test type</div>
            <div className="text-yellow-500">time {results.time}s</div>
            <div className="text-yellow-500">english</div>
          </div>
          <div>
            <div className="text-gray-500">raw</div>
            <div className="text-yellow-500">{Math.round(results.wpm * 1.05)}</div>
          </div>
          <div>
            <div className="text-gray-500">characters</div>
            <div
              className="text-yellow-500 cursor-help"
              title={`correct: ${getCharacterStats().correct}
incorrect: ${getCharacterStats().incorrect}
extra: ${getCharacterStats().extra}
missed: ${getCharacterStats().missed}`}
            >
              {getCharacterStats().correct}/
              {getCharacterStats().incorrect}/
              {getCharacterStats().extra}/
              {getCharacterStats().missed}
            </div>
          </div>
          <div>
            <div className="text-gray-500">consistency</div>
            <div className="text-yellow-500">{results.consistency}%</div>
          </div>
        </div>

        {/* Play Again Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-500 text-black px-6 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors"
          >
            play again
          </button>
        </div>
      </div>
    </div>
  );
}
