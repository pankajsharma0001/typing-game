import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/router";

export default function TypingGame() {
  const router = useRouter();
  const startTimeRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const { data: session } = useSession();

  const [difficulty, setDifficulty] = useState("easy");
  const [sentences, setSentences] = useState([]);
  const [timer, setTimer] = useState("30s");
  const [timeLeft, setTimeLeft] = useState(30);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [typedText, setTypedText] = useState("");

  const [windowLineIndex, setWindowLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState([]);
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
    setCompletedLinesStats([]);

    async function fetchSentences() {
      try {
        const res = await axios.get(`/api/sentences?difficulty=${difficulty}&count=20`);
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
  }, [timeLeft, started, finished]);

  const wrapIndex = (idx) => (sentences.length ? idx % sentences.length : 0);

  useEffect(() => {
    if (!sentences.length) return;
    const firstIdx = wrapIndex(windowLineIndex);
    const secondIdx = wrapIndex(windowLineIndex + 1);
    setVisibleLines([sentences[firstIdx]?.text || "", sentences[secondIdx]?.text || ""]);
  }, [windowLineIndex, sentences]);

  const startGame = () => {
    setStarted(true);
    setFinished(false);
    setTypedText("");
    setTimeLeft(timerInSeconds);
    setCompletedLinesStats([]);
    startTimeRef.current = Date.now();
    // Add a small delay to ensure the input is rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!started || finished || !visibleLines.length) return;
    const currentLine = visibleLines[0];
    if (typedText.length === currentLine.length) {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);

      const lineStats = {
        total: currentLine.length,
        correct: 0,
        incorrect: 0,
        extra: 0,
        missed: 0,
        time: elapsed // ✅ record real elapsed time
      };

      [...currentLine].forEach((char, idx) => {
        if (idx < typedText.length) {
          if (typedText[idx] === char) lineStats.correct++;
          else lineStats.incorrect++;
        } else lineStats.missed++;
      });

      lineStats.extra = Math.max(0, typedText.length - currentLine.length);
      setCompletedLinesStats((prev) => [...prev, lineStats]);
      setWindowLineIndex((prev) => prev + 1);
      setTypedText("");
    }
  }, [typedText, visibleLines, started, finished]);

  const finishGame = async () => {
    setFinished(true);
    if (!session) return signIn();

    let totalChars = 0;
    let totalCorrectChars = 0;

    completedLinesStats.forEach((stat) => {
      totalChars += stat.total;
      totalCorrectChars += stat.correct;
    });

    const currentLine = visibleLines[0] || "";
    if (typedText.length > 0) {
      totalChars += typedText.length;
      totalCorrectChars += [...typedText].filter((c, i) => c === currentLine[i]).length;
    }

    const elapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const elapsedSeconds = Math.round(elapsedMs / 1000);
    const minutes = Math.max(0.0167, elapsedMs / 1000 / 60);
    const wpm = Math.round((totalCorrectChars / 5) / minutes);
    const accuracy = totalChars > 0 ? Math.round((totalCorrectChars / totalChars) * 100) : 0;

    // ✅ create history with real time values
    const history = completedLinesStats.map((s) => ({
      time: s.time,
      wpm: Math.round((s.correct / 5) / ((s.time || 1) / 60))
    }));

    // ✅ push a final point to mark the end of test
    if (history.length === 0 || history[history.length - 1].time < elapsedSeconds) {
      history.push({
        time: elapsedSeconds,
        wpm
      });
    }

    try {
      await axios.post("/api/games", { wpm, accuracy, score: totalCorrectChars, difficulty });
      router.push({
        pathname: "/result",
        query: {
          results: JSON.stringify({
            wpm,
            accuracy,
            time: elapsedSeconds,
            history,
            characterStats: {
              correct: totalCorrectChars,
              incorrect: completedLinesStats.reduce((a, s) => a + s.incorrect, 0),
              extra: completedLinesStats.reduce((a, s) => a + s.extra, 0),
              missed: completedLinesStats.reduce((a, s) => a + s.missed, 0)
            }
          })
        }
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save results.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-3xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Typing Game</h2>

      {!started && (
        <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
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
          <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>
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

      {started && timer !== "Unlimited" && (
        <div className="text-center mb-4 font-mono text-xl font-bold text-gray-900">
          {timeLeft}s
        </div>
      )}

      <div
        ref={containerRef}
        className="mb-4 p-4 bg-purple-50 rounded-lg font-mono text-lg leading-relaxed h-[4.5rem] overflow-hidden text-gray-400"
      >
        {visibleLines.map((line, lineIdx) => (
          <div key={`line-${lineIdx}`} className="whitespace-pre">
            {line.split("").map((char, charIdx) => {
              let colorClass = "text-gray-400";
              if (lineIdx === 0 && charIdx < typedText.length) {
                colorClass = typedText[charIdx] === char ? "text-green-600" : "text-red-600";
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

      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={(e) => setTypedText(e.target.value)}
        className="w-full px-4 py-2 bg-white text-gray-900 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        disabled={!started || finished}
        placeholder={started ? "Type here..." : "Click start to begin"}
      />

      <div className="flex flex-col md:flex-row justify-center gap-4 mb-4 mt-6"> {/* Added mt-6 for margin-top */}
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
        <p className="mt-4 text-center text-gray-700 font-medium">
          ✅ Game Finished! Your results are saved.
        </p>
      )}
    </div>
  );
}
