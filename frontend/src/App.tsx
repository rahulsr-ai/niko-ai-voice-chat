//@ts-ignore
import { useRef, useState } from "react";
import SpeakingAura from "./components/ai-speak";
import SpeakingLine from "./components/SpeakingLine";
import GeminiThinking from "./components/GeminiThinking";
import allStyles from "./styles";
import Notification from "./components/Notification";

export default function App() {
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  console.log("🌐 Backend URL:", BASE_URL);

  const [start, setStart] = useState(false);
  const [btnText, setBtnText] = useState("START");
  const [transcribedText, setTranscribedText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [language, setLanguage] = useState("English");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  const [conversation, setConversation] = useState<
    { role: "user" | "ai"; message: string }[]
  >([]);
  const [style, setStyle] = useState("Conversational");
  const [instruction, setInstruction] = useState<string>(
    "You are Niko, a calm and thoughtful AI assistant. Respond to user queries with empathy and clarity."
  );

  const [styleOptions, setStyleOptions] =
    useState<{ label: string; value: string }[]>(allStyles);

  const recognitionRef = useRef<Window | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (BASE_URL === undefined) {
    console.error("❌ VITE_BACKEND_URL is not defined in .env file");
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <h1 className="text-2xl font-bold">
          Please set <code>VITE_BACKEND_URL</code> in your <code>.env</code>{" "}
          file.
        </h1>
      </div>
    );
  }

  const startAIVoice = () => {
    if (!start) {
      setBtnText("STOP");
      setStart(true);
      startSpeechRecognition();
    } else {
      setBtnText("START");
      setStart(false);
      stopSpeechRecognition();
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("❌ Your browser doesn't support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setTranscribedText(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        finalTranscript = transcript;
      }
    };

    recognition.onend = () => {
      console.log("🛑 Speech recognition stopped.");

      if (finalTranscript.trim()) {
        sendToGemini(finalTranscript);
      } else if (start) {
        startSpeechRecognition();
      }
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
    };

    recognition.start();
    setTranscribedText("");
    console.log("🎤 Listening...");
  };

  const stopSpeechRecognition = () => {
    recognitionRef.current?.stop();
  };

  const sendToGemini = async (userText: string) => {
    setIsThinking(true);

    const updatedConversation = [
      ...conversation,
      { role: "user", message: userText },
    ];
    setConversation(updatedConversation as any);

    try {
      const res = await fetch(`${BASE_URL}/api/gemini/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedConversation,
          style: style,
          system_instruction: instruction,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "⚠️ No response from Gemini";

      setConversation((prev) => [...prev, { role: "ai", message: replyText }]);
      sendGeminiToSpeech(replyText);
    } catch (err) {
      console.error("❌ Gemini request failed:", err);
    } finally {
      setIsThinking(false);
    }
  };

  async function sendGeminiToSpeech(geminiText: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/murf/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: geminiText,
          style: style,
          language: language,
        }),
      });

      const data = await res.json();
      const audio = new Audio(data.audio_url);
      audioRef.current = audio;

      audio.onended = () => {
        console.log("🔁 Restarting voice listening...");
        startSpeechRecognition();
      };

      audio.play();
    } catch (error) {
      console.error("❌ Error sending Gemini text to speech:", error);
    }
  }

  function applyStyleAndInstruction() {
    setBtnText("START");
    setStart(false);
    setNotificationMsg("✅ Settings applied successfully!");
    setShowNotification(true);
    stopSpeechRecognition();
  }

  function handleLanguageChange(e: string) {
    switch (e) {
      case "Spanish":
        setStyleOptions([
          { label: "😊 Conversational", value: "Conversational" },
        ]);
        break;

      case "Hindi":
        setStyleOptions([
          { label: "😊 Conversational", value: "Conversational" },
        ]);
        break;

      case "French":
        setStyleOptions([
          { label: "😊 Conversational", value: "Conversational" },
        ]);
        break;

      default:
        setStyleOptions(allStyles);
        break;
    }
    setLanguage(e);
  }

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center px-4 bg-black text-white">
      <h3 className="font-bold text-white text-3xl">
        {showNotification && (
          <Notification
            message={notificationMsg}
            onClose={() => setShowNotification(false)}
          />
        )}
        SPEAK WITH <span className="text-green-600">NIKO</span>
      </h3>

      <div className="p-2 w-full">
        <SpeakingAura />
      </div>

      {start ? (
        <SpeakingLine />
      ) : (
        <div className="text-center text-lg text-green-200">
          <p>AI is now ready to speak with you!</p>
        </div>
      )}

      {transcribedText && (
        <div className="mt-6 max-w-xl w-full px-4 py-3 bg-zinc-800/40 rounded-xl space-y-2 my-4">
          <span className="text-lg font-semibold">You said:</span>
          <span className="text-md mt-1 ml-3 italic leading-relaxed">
            {transcribedText}
          </span>
        </div>
      )}

      {isThinking && <GeminiThinking />}

      <div className="mt-8 w-full max-w-4xl px-4 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
        <div className="w-full space-y-5 mx-auto">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-green-300">
                Conversation Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="bg-zinc-800 text-white px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-green-300">
                Accent
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Hindi">Indian</option>
                <option value="English">US </option>
                <option value="French">French </option>
                <option value="Spanish">Spanish </option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-green-300">
              System Instruction
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe how Niko should behave... or give Niko a fun nickname!"
              className="bg-zinc-800 text-white px-4 py-2 rounded-lg w-full h-24 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center mt-6 gap-3 sm:gap-4 w-full">
            <button
              onClick={applyStyleAndInstruction}
              className="text-lg sm:text-xl font-semibold px-5 py-3 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-green-500 to-zinc-700 hover:from-zinc-500 hover:to-green-600 transition-all text-white shadow-md hover:shadow-green-500/50 w-full sm:w-auto cursor-pointer"
            >
              Apply Settings
            </button>

            <button
              onClick={startAIVoice}
              className="text-lg sm:text-xl font-semibold px-5 py-3 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-green-500 to-zinc-700 hover:from-zinc-500 hover:to-green-600 transition-all text-white shadow-md hover:shadow-green-500/50 w-full sm:w-auto cursor-pointer"
            >
              {btnText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
