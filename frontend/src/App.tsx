// @ts-ignore

import React, { useRef, useState } from "react";
import SpeakingAura from "./components/ai-speak";
import SpeakingLine from "./components/SpeakingLine";
import GeminiThinking from "./components/GeminiThinking";

export default function App() {
  const [start, setStart] = useState(false);
  const [btnText, setBtnText] = useState("START");
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [conversation, setConversation] = useState<
    { role: "user" | "ai"; message: string }[]
  >([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
      setIsListening(false);
      if (finalTranscript.trim()) {
        sendToGemini(finalTranscript);
      } else if (start) {
        startSpeechRecognition(); // silence? keep listening if user hasn't pressed STOP
      }
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
    };

    recognition.start();
    setIsListening(true);
    setTranscribedText("");
    setAiReply("");
    console.log("🎤 Listening...");
  };

  const stopSpeechRecognition = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const sendToGemini = async (userText: string) => {
    setIsThinking(true);

    // Add user message to local conversation
    const updatedConversation = [
      ...conversation,
      { role: "user", message: userText },
    ];
    setConversation(updatedConversation);

    try {
      const res = await fetch("http://localhost:8000/api/gemini/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedConversation }),
      });

      const data = await res.json();
      const replyText = data.reply || "⚠️ No response from Gemini";

      // Add Gemini reply to conversation
      setConversation((prev) => [...prev, { role: "ai", message: replyText }]);
      setAiReply(replyText);

      sendGeminiToSpeech(replyText);
    } catch (err) {
      console.error("❌ Gemini request failed:", err);
      setAiReply("❌ Failed to connect to Gemini.");
    } finally {
      setIsThinking(false);
    }
  };

  async function sendGeminiToSpeech(geminiText: string) {
    try {
      const res = await fetch("http://localhost:8000/api/murf/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: geminiText }),
      });

      const data = await res.json();
      const audio = new Audio(data.audio_url);

      // 🔁 When AI voice playback finishes, restart listening
      audio.onended = () => {
        console.log("🔁 Restarting voice listening...");
        startSpeechRecognition();
      };

      audio.play();
    } catch (error) {
      console.error("❌ Error sending Gemini text to speech:", error);
      setAiReply("❌ Failed to convert Gemini response to speech.");
    }
  }

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center px-4 bg-black text-white">
      <h3 className="font-bold text-white text-3xl">
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

      <div className="flex items-center justify-center mt-4">
        <button
          className="text-2xl font-bold px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-zinc-700 hover:from-zinc-500 hover:to-green-600 transition-all text-white shadow-lg cursor-pointer hover:shadow-green-500/50"
          onClick={startAIVoice}
        >
          {btnText}
        </button>
      </div>
    </section>
  );
}
