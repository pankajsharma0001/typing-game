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
      
      // Don't filter out zero values, but ensure history starts from 0
      let fullHistory = resultObj.history;
      if (fullHistory.length > 0 && fullHistory[0].time > 0) {
        fullHistory = [
          { time: 0, wpm: 0, isMark: true },
          ...fullHistory
        ];
      }
      
      // Calculate consistency only from non-zero values
      const nonZeroWpm = fullHistory.filter(h => h.wpm > 0).map(h => h.wpm);
      let consistency = 0;
      
      if (nonZeroWpm.length > 0) {
        const avgWpm = nonZeroWpm.reduce((a, b) => a + b, 0) / nonZeroWpm.length;
        const variance = nonZeroWpm.reduce((a, b) => a + Math.pow(b - avgWpm, 2), 0) / nonZeroWpm.length;
        consistency = Math.round(100 - (Math.sqrt(variance) / avgWpm * 100));
      }

      setResults({
        ...resultObj,
        history: fullHistory,
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
            <LineChart data={results.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                tickFormatter={(value) => `${value}s`}
                domain={[0, 'dataMax']}  // Force start from 0
                allowDataOverflow={true}
              />
              <YAxis 
                stroke="#666"
                domain={[0, 'dataMax + 10']}
                allowDataOverflow={true}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#222', 
                  border: 'none',
                  borderRadius: '4px'
                }}
                formatter={(value) => [`${value} wpm`, 'Speed']}
                isAnimationActive={false}  // Disable animation for more accurate readings
              />
              <Line 
                type="monotone"
                dataKey="wpm"
                stroke="#FFD700"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}  // Disable animation for more accurate readings
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-4 gap-4 text-center font-mono">
          <div>
            <div className="text-gray-500">test type</div>
            <div className="text-yellow-500">time {results.time}</div>
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
