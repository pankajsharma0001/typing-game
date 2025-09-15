import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import { useRouter } from 'next/router';

export default function TypingGame() {
  const router = useRouter();
  const startTimeRef = useRef(null);
  const containerRef = useRef(null);
  const { data: session } = useSession();

  const [difficulty, setDifficulty] = useState("easy");
  const [sentences, setSentences] = useState([]);
  const [timer, setTimer] = useState("30s");
  const [timeLeft, setTimeLeft] = useState(30);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [typedText, setTypedText] = useState("");

  const [windowLineIndex, setWindowLineIndex] = useState(0); // Index of first visible line
  const [visibleLines, setVisibleLines] = useState([]);

  // Add this state to track correct characters for each completed line
  const [completedLinesStats, setCompletedLinesStats] = useState([]);

  const timerInSeconds =
    timer === "15s" ? 15 : timer === "30s" ? 30 : timer === "1m" ? 60 : Infinity;

  // Fetch sentences
  useEffect(() => {
    setTimeLeft(timerInSeconds);
    setStarted(false);
    setFinished(false);
    setTypedText("");
    setWindowLineIndex(0);
    setVisibleLines([]);

    async function fetchSentences() {
      try {
        const res = await axios.get(
          `/api/sentences?difficulty=${difficulty}&count=20`
        );
        setSentences(res.data.map((s) => ({ text: s.text || "" })));
      } catch (err) {
        console.error(err);
        setSentences([]);
      }
    }

    fetchSentences();
  }, [difficulty, timer]);

  // Timer countdown
  useEffect(() => {
    if (!started || finished || timeLeft === Infinity) return;
    if (timeLeft === 0) {
      finishGame();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, started, finished, finishGame]);

  // Utility: wrap index
  const wrapIndex = (idx) => {
    if (!sentences.length) return 0;
    return idx % sentences.length;
  };

  // Update visible lines
  useEffect(() => {
    if (!sentences.length) return;
    const firstIdx = wrapIndex(windowLineIndex);
    const secondIdx = wrapIndex(windowLineIndex + 1);

    setVisibleLines([
      sentences[firstIdx]?.text || "",
      sentences[secondIdx]?.text || "",
    ]);
  }, [windowLineIndex, sentences, wrapIndex]);

  const startGame = () => {
    setStarted(true);
    setFinished(false);
    setTypedText("");
    setTimeLeft(timerInSeconds);
    setCompletedLinesStats([]); // Reset stats
    startTimeRef.current = Date.now();
  };

  // Advance line when fully typed
  useEffect(() => {
    if (!started || finished || !visibleLines.length) return;
    const currentLine = visibleLines[0];

    if (typedText.length === currentLine.length) {
      // Calculate character stats for this line
      const lineStats = {
        total: currentLine.length,
        correct: 0,
        incorrect: 0,
        extra: 0,
        missed: 0
      };

      // Count correct, incorrect, and missed characters
      [...currentLine].forEach((char, idx) => {
        if (idx < typedText.length) {
          if (typedText[idx] === char) {
            lineStats.correct++;
          } else {
            lineStats.incorrect++;
          }
        } else {
          lineStats.missed++;
        }
      });

      // Count extra characters (typed chars beyond line length)
      lineStats.extra = Math.max(0, typedText.length - currentLine.length);

      setCompletedLinesStats(prev => [...prev, lineStats]);
      setWindowLineIndex(prev => prev + 1);
      setTypedText("");
    }
  }, [typedText, visibleLines, started, finished]);

  const finishGame = async () => {
    setFinished(true);
    if (!session) {
      signIn();
      return;
    }

    // Calculate total characters typed and correct characters
    let totalChars = 0;
    let totalCorrectChars = 0;

    // Count completed lines using stored stats
    completedLinesStats.forEach(stat => {
      totalChars += stat.total;
      totalCorrectChars += stat.correct;
    });

    // Add current line stats
    const currentLine = visibleLines[0] || "";
    if (typedText.length > 0) {
      totalChars += typedText.length;
      totalCorrectChars += [...typedText].filter(
        (char, idx) => char === currentLine[idx]
      ).length;
    }

    // Calculate time
    const elapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const elapsedSeconds = Math.round(elapsedMs / 1000);
    const minutes = Math.max(0.0166667, elapsedMs / 1000 / 60);

    // Calculate WPM and accuracy
    const wpm = Math.round((totalCorrectChars / 5) / minutes);
    const accuracy = totalChars > 0 
      ? Math.round((totalCorrectChars / totalChars) * 100)
      : 0;

    // Calculate totals including extra and missed
    let totalStats = {
      correct: 0,
      incorrect: 0,
      extra: 0,
      missed: 0
    };

    completedLinesStats.forEach(stat => {
      totalStats.correct += stat.correct;
      totalStats.incorrect += stat.incorrect;
      totalStats.extra += stat.extra;
      totalStats.missed += stat.missed;
    });

    // Add current line stats if any
    if (typedText.length > 0) {
      [...currentLine].forEach((char, idx) => {
        if (idx < typedText.length) {
          if (typedText[idx] === char) {
            totalStats.correct++;
          } else {
            totalStats.incorrect++;
          }
        } else {
          totalStats.missed++;
        }
      });
      totalStats.extra += Math.max(0, typedText.length - currentLine.length);
    }

    // Calculate WPM history from the start
    const history = [];
    const dataInterval = 2;
    const markInterval = 5;

    for (let i = 0; i <= elapsedSeconds; i += dataInterval) {
      const timePoint = Math.max(1, i); // Ensure minimum 1 second
      const partialStats = completedLinesStats.filter((_, index) => {
        const statTime = (index + 1) * (elapsedSeconds / completedLinesStats.length);
        return statTime <= timePoint;
      });

      let partialCorrect = partialStats.reduce((sum, stat) => sum + stat.correct, 0);
      let partialMinutes = timePoint / 60;
      let partialWpm = Math.round((partialCorrect / 5) / partialMinutes);

      history.push({
        time: i,
        wpm: partialWpm,
        isMark: i % markInterval === 0
      });
    }

    // Add final data point
    history.push({
      time: elapsedSeconds,
      wpm: wpm,
      isMark: true // Always mark the final point
    });

    // Prepare results data
    const results = {
      wpm,
      accuracy,
      time: elapsedSeconds,
      score: totalStats.correct,
      history,
      dataInterval,
      markInterval,
      characterStats: totalStats
    };

    try {
      // Save results to database
      await axios.post("/api/games", { 
        wpm, 
        accuracy, 
        score: totalCorrectChars, 
        difficulty 
      });

      // Reset game state
      setStarted(false);
      setFinished(false);
      setTypedText("");
      setWindowLineIndex(0);
      setCompletedLinesStats([]);

      // Navigate to results page with data
      router.push({
        pathname: '/result',
        query: { 
          results: JSON.stringify(results)
        }
      });

    } catch (err) {
      console.error(err);
      alert("Failed to save results.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-3xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">
        Typing Game
      </h2>

      {/* Controls */}
      {!started && (
        <div className="flex justify-center items-center gap-6 mb-6">
          {["easy", "medium", "hard"].map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                difficulty === level
                  ? "bg-purple-700 text-white shadow-lg"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
          <div className="h-8 w-px bg-gray-300"></div>
          {["15s", "30s", "1m", "Unlimited"].map((t) => (
            <button
              key={t}
              onClick={() => setTimer(t)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                timer === t
                  ? "bg-purple-700 text-white"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Timer */}
      {started && timer !== "Unlimited" && (
        <div className="text-center mb-4 font-mono text-xl font-bold text-gray-900">
          {timeLeft}s
        </div>
      )}

      {/* Sentence Display */}
      <div
        ref={containerRef}
        className="mb-4 p-4 bg-purple-50 rounded-lg font-mono text-lg leading-relaxed h-[4.5rem] overflow-hidden text-gray-400"
      >
        {visibleLines.map((line, lineIdx) => (
          <div key={`line-${lineIdx}`} className="whitespace-pre">
            {line.split("").map((char, charIdx) => {
              let colorClass = "text-gray-400";
              if (lineIdx === 0 && charIdx < typedText.length) {
                colorClass =
                  typedText[charIdx] === char ? "text-green-600" : "text-red-600";
              }
              return (
                <span key={`${lineIdx}-${charIdx}`} className={colorClass}>
                  {char}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* Input */}
      <textarea
        value={typedText}
        onChange={(e) => {
          if (!started || finished) return;
          setTypedText(e.target.value);
        }}
        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4 text-gray-900"
        disabled={!started || finished}
        rows={4}
      />

      {/* Start / Finish */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        {!started && (
          <button
            onClick={startGame}
            className="bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-800 transition-colors"
          >
            Start
          </button>
        )}
        {started && !finished && timer === "Unlimited" && (
          <button
            onClick={finishGame}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Finish
          </button>
        )}
      </div>

      {finished && (
        <div className="mt-4 text-center text-gray-700 font-medium">
          Game Finished! Your results are saved.
        </div>
      )}
    </div>
  );
}
