import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/router";

export default function TypingGame() {
  const router = useRouter();
  const startTimeRef = useRef(null);
  const { data: session } = useSession();

  const [difficulty, setDifficulty] = useState("easy");
  const [sentences, setSentences] = useState([]);
  const [timer, setTimer] = useState("30s");
  const [timeLeft, setTimeLeft] = useState(30);
  const [elapsed, setElapsed] = useState(0); // For Unlimited mode
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [pendingStart, setPendingStart] = useState(false); 
  const [firstKey, setFirstKey] = useState(""); // Store first key pressed

  const [windowLineIndex, setWindowLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState([]);
  const [completedLinesStats, setCompletedLinesStats] = useState([]);

  // Fetch sentences
  useEffect(() => {
    async function fetchSentences() {
      setTimeLeft(
        timer === "15s" ? 15 :
        timer === "30s" ? 30 :
        timer === "1m"  ? 60 :
        Infinity
      );
      setElapsed(0);
      setStarted(false);
      setFinished(false);
      setTypedText("");
      setWindowLineIndex(0);
      setVisibleLines([]);
      setCompletedLinesStats([]);

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

  // Countdown timer for fixed modes
  useEffect(() => {
    if (!started || finished || timeLeft === Infinity) return;
    if (timeLeft === 0) {
      finishGame();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, started, finished]);

  // Elapsed timer for Unlimited mode
  useEffect(() => {
    if (!started || finished || timer !== "Unlimited") return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [started, finished, timer]);

  const wrapIndex = (idx) => (sentences.length ? idx % sentences.length : 0);

  useEffect(() => {
    if (!sentences.length) return;
    const firstIdx = wrapIndex(windowLineIndex);
    const secondIdx = wrapIndex(windowLineIndex + 1);
    setVisibleLines([sentences[firstIdx]?.text || "", sentences[secondIdx]?.text || ""]);
  }, [windowLineIndex, sentences]);

  // Start game after first alphabet key
  useEffect(() => {
    if (pendingStart && !started) {
      const seconds =
        timer === "15s" ? 15 :
        timer === "30s" ? 30 :
        timer === "1m"  ? 60 :
        Infinity;

      setStarted(true);
      setFinished(false);
      setTypedText(firstKey); // ✅ Preserve first key
      setTimeLeft(seconds);
      setElapsed(0);
      setCompletedLinesStats([]);
      startTimeRef.current = Date.now();
      setPendingStart(false);
      setFirstKey(""); // reset
    }
  }, [pendingStart, started, timer, firstKey]);

  // Handle key presses
  useEffect(() => {
    const handleKey = (e) => {
      if (finished) return;

      const isLetter = /^[a-zA-Z]$/.test(e.key);
      if (!started && !pendingStart && isLetter) {
        setFirstKey(e.key);     
        setPendingStart(true);  
        return;
      }

      if (!started) return;

      if (e.key === "Backspace") {
        setTypedText((prev) => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        setTypedText((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, finished, pendingStart]);

  // Line completion detection
  useEffect(() => {
    if (!started || finished || !visibleLines.length) return;
    const currentLine = visibleLines[0];
    if (typedText.length === currentLine.length) {
      const elapsedSec = Math.round((Date.now() - startTimeRef.current) / 1000);

      const lineStats = {
        total: currentLine.length,
        correct: 0,
        incorrect: 0,
        extra: 0,
        missed: 0,
        time: elapsedSec
      };

      [...currentLine].forEach((char, idx) => {
        if (typedText[idx] === char) lineStats.correct++;
        else lineStats.incorrect++;
      });

      lineStats.extra = Math.max(0, typedText.length - currentLine.length);
      setCompletedLinesStats((prev) => [...prev, lineStats]);
      setWindowLineIndex((prev) => prev + 1);
      setTypedText("");
    }
  }, [typedText, visibleLines, started, finished]);

  // Finish game
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

    const history = completedLinesStats.map((s) => ({
      time: s.time,
      wpm: Math.round((s.correct / 5) / ((s.time || 1) / 60))
    }));

    if (history.length === 0 || history[history.length - 1].time < elapsedSeconds) {
      history.push({ time: elapsedSeconds, wpm });
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
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-3xl shadow-2xl select-none">
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

      {started && timer === "Unlimited" && (
        <div className="text-center mb-4 font-mono text-xl font-bold text-gray-900">
          Elapsed: {elapsed}s
        </div>
      )}

      <div className="mb-4 p-4 bg-purple-50 rounded-lg font-mono text-lg leading-relaxed h-[4.5rem] overflow-hidden text-gray-400">
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

      {started && !finished && timer === "Unlimited" && (
        <button
          onClick={finishGame}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Finish
        </button>
      )}

      {finished && (
        <p className="mt-4 text-center text-gray-700 font-medium">
          ✅ Game Finished! Your results are saved.
        </p>
      )}

      <div className="fixed bottom-4 right-4 text-right text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Typing Game</p>
        <p className="text-purple-600">Made by Pankaj Sharma</p>
      </div>
    </div>
  );
}
