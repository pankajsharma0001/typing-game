import { useState, useEffect, useRef } from "react";
import { getSession } from "next-auth/react";
import axios from "axios";

export default function TypingGame() {
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const [difficulty, setDifficulty] = useState("easy");
  const [sentences, setSentences] = useState([]);
  const [sentence, setSentence] = useState("");
  const [timer, setTimer] = useState("30s");
  const [timeLeft, setTimeLeft] = useState(30);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [typedText, setTypedText] = useState("");

  const timerInSeconds =
    timer === "15s" ? 15 : timer === "30s" ? 30 : timer === "1m" ? 60 : Infinity;

  // Fetch sentences whenever difficulty/timer changes
  useEffect(() => {
    setTimeLeft(timerInSeconds);
    setCurrentSentenceIndex(0);
    setTypedText("");
    setFinished(false);
    setStarted(false);

    async function fetchSentences() {
      try {
        const res = await axios.get(`/api/sentences?difficulty=${difficulty}`);
        setSentences(res.data);

        if (res.data.length > 0) {
          setSentence(res.data[0].text);
        }
      } catch (err) {
        console.error("Failed to fetch sentences", err);
      }
    }
    fetchSentences();
  }, [difficulty, timer]);

  // Timer countdown
  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft === 0) {
      finishGame();
      return;
    }
    if (timeLeft === Infinity) return;

    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, started, finished]);

  const startGame = () => {
    setStarted(true);
    setFinished(false);
    setTypedText("");
    setTimeLeft(timerInSeconds);
    startTimeRef.current = Date.now();
  };

  const handleNextSentence = () => {
    const nextIndex = currentSentenceIndex + 1;
    if (nextIndex < sentences.length) {
      setCurrentSentenceIndex(nextIndex);
      setSentence(sentences[nextIndex].text);
      setTypedText("");
    } else if (timer !== "Unlimited") {
      finishGame();
    }
  };

  const finishGame = async () => {
    setFinished(true);

    const currentSentence = sentences[currentSentenceIndex]?.text || "";

    // number of correct characters (net)
    const correctChars = [...typedText].filter(
      (c, i) => c === currentSentence[i]
    ).length;

    // elapsed time in seconds
    const elapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const elapsedSec = Math.max(1, elapsedMs / 1000); // avoid division by zero
    const minutes = elapsedSec / 60;

    // Net WPM: correct characters => words (5 chars = 1 word)
    const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;

    // accuracy
    const accuracy = currentSentence.length
      ? Math.round((correctChars / currentSentence.length) * 100)
      : 0;

    try {
      const session = await getSession();
      if (!session) {
        alert("You must be logged in to save your score!");
        return;
      }

      await axios.post("/api/games", {
        score: correctChars,
        wpm,
        accuracy,
        difficulty,
      });

      alert(`Game finished! WPM: ${wpm}, Accuracy: ${accuracy}%`);
    } catch (error) {
      console.error(error);
      alert("Failed to save results. Make sure you are logged in.");
    }
    setStarted(false);
    setFinished(false);
  };

  // Automatically go to next sentence when fully typed
    useEffect(() => {
    if (!started) return; // only run if game started
    const currentSentence = sentences[currentSentenceIndex]?.text || "";
    if (typedText.length >= currentSentence.length && !finished) {
        handleNextSentence();
    }
    }, [typedText, started, finished, currentSentenceIndex, sentences]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-3xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">
        Typing Game
      </h2>

      {/* Difficulty Selector */}
      <div className="flex gap-4 mb-4 justify-center items-center">
        <span className="font-medium text-gray-700">Difficulty:</span>
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
      </div>

      {/* Timer Selector */}
      <div className="flex gap-4 mb-6 justify-center items-center">
        <span className="font-medium text-gray-700">Timer:</span>
        {["15s", "30s", "1m", "Unlimited"].map((t) => (
          <button
            key={t}
            onClick={() => setTimer(t)}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              timer === t
                ? "bg-purple-700 text-white"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-4 font-mono text-gray-900 font-bold">
          {timeLeft === Infinity ? "∞" : timeLeft}s
        </span>
      </div>

      {/* Sentence Display */}
      <div className="mb-4 p-4 bg-purple-50 rounded-lg text-gray-400 font-mono text-lg leading-relaxed">
        {(sentences[currentSentenceIndex]?.text || "").split("").map((char, idx) => {
          let colorClass = "text-gray-400"; // faint default
          if (idx < typedText.length) {
            colorClass =
              typedText[idx] === char ? "text-green-600" : "text-red-600";
          }
          return (
            <span key={idx} className={colorClass}>
              {char}
            </span>
          );
        })}
      </div>

      {/* User Input */}
      <textarea
        value={typedText}
        onChange={(e) => setTypedText(e.target.value)}
        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4 text-gray-900"
        disabled={!started || finished}
        rows={4}
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        {!started && (
          <button
            onClick={startGame}
            className="bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-800 transition-colors"
          >
            Start
          </button>
        )}

        {started && !finished && (
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
