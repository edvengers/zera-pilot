"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { Send, Shield, Zap, Skull } from "lucide-react"; // Using some icons for the HUD feel

export default function StudentController() {
  // State
  const [studentName, setStudentName] = useState("");
  const [inputName, setInputName] = useState("");
  const [view, setView] = useState("login"); // login, calibration, game, stealth
  const [hp, setHp] = useState(100);
  const [answerKey, setAnswerKey] = useState("");
  const [inputAnswer, setInputAnswer] = useState("");
  const [inputChat, setInputChat] = useState("");
  const [feedback, setFeedback] = useState(null); // 'HIT!', 'MISS', or null

  // Chat State
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chat_history");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Subscribe to Session Data
  useEffect(() => {
    if (view === "game" || view === "stealth") {
      const unsub = onSnapshot(doc(db, "sessions", "live"), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setHp(data.current_hp);
          setAnswerKey(data.answer_key);
        }
      });
      return () => unsub();
    }
  }, [view]);

  // --- Handlers ---

  const handleLogin = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setStudentName(inputName.trim());
    setView("calibration");
  };

  const handleCalibration = async (type) => {
    if (type === "overwhelmed") {
      try {
        await addDoc(collection(db, "alerts"), {
          student_name: studentName,
          type: "overwhelmed",
          message: "Status: Overwhelmed",
          timestamp: serverTimestamp(),
        });
        setView("stealth");
      } catch (err) {
        console.error("Error sending alert:", err);
      }
    } else {
      // ready or okay
      setView("game");
    }
  };

  const handleGameSubmit = async (e) => {
    e.preventDefault();
    if (!inputAnswer.trim()) return;

    if (inputAnswer.trim() === answerKey) {
      // Correct
      setFeedback("HIT!");
      try {
        await updateDoc(doc(db, "sessions", "live"), {
          current_hp: increment(-10),
        });
      } catch (err) {
        console.error("Error updating HP:", err);
      }
    } else {
      // Wrong
      setFeedback("MISS");
    }

    setInputAnswer("");
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleStealthSubmit = async (e) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const userMsg = { role: "user", text: inputChat };
    // Optimistic update
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputChat("");
    setIsLoading(true);

    try {
      // 1. Log to Firebase (Alerts)
      await addDoc(collection(db, "alerts"), {
        student_name: studentName,
        type: "chat",
        message: userMsg.text,
        timestamp: serverTimestamp(),
      });

      // 2. Call AI API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass 'messages' (current state before update) as history to avoid duplication,
        // since the backend appends the current message to the prompt as well.
        body: JSON.stringify({ message: userMsg.text, history: messages }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "> [SYSTEM ERROR]: Connection failed." },
        ]);
      }
    } catch (err) {
      console.error("Error sending chat:", err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "> [SYSTEM ERROR]: Connection failed." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Views ---

  if (view === "login") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-cyan-500 font-mono p-4">
        <div className="border border-cyan-800 p-8 rounded-lg shadow-lg shadow-cyan-900/20 w-full max-w-md bg-zinc-950">
          <h1 className="text-2xl mb-6 text-center tracking-widest uppercase border-b border-cyan-900 pb-2">
            Identity Verification
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 opacity-70">
                Enter Codename
              </label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-black border border-cyan-700 text-cyan-400 p-3 rounded focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-cyan-900"
                placeholder="Name..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-900 hover:bg-cyan-800 text-cyan-100 py-3 rounded uppercase tracking-wider font-bold transition-colors"
            >
              Initialize Link
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === "calibration") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-8">
          <h2 className="text-3xl font-bold mb-8">System Status Check</h2>
          <div className="grid gap-4">
            <button
              onClick={() => handleCalibration("ready")}
              className="p-6 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all transform hover:scale-105"
            >
              <div className="text-4xl mb-2">🔥</div>
              <div className="font-semibold text-lg">Ready to Go</div>
            </button>
            <button
              onClick={() => handleCalibration("okay")}
              className="p-6 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all transform hover:scale-105"
            >
              <div className="text-4xl mb-2">😐</div>
              <div className="font-semibold text-lg">I'm Okay</div>
            </button>
            <button
              onClick={() => handleCalibration("overwhelmed")}
              className="p-6 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all transform hover:scale-105"
            >
              <div className="text-4xl mb-2">⛈️</div>
              <div className="font-semibold text-lg">Overwhelmed</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Common UI for Game and Stealth (The HUD)
  const isStealth = view === "stealth";
  // The HUD color is now consistently cyan/blue for "futuristic"

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#003333 1px, transparent 1px), linear-gradient(90deg, #003333 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* Header HUD */}
      <div className="p-4 border-b border-cyan-900 flex justify-between items-center bg-zinc-950/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
          <span className="text-xs tracking-[0.2em] uppercase text-cyan-200">
            {studentName} :: Linked
          </span>
        </div>
        <div className="text-xl font-bold flex items-center gap-2 text-cyan-300">
          <Skull size={20} />
          <span>BOSS HP: {hp}</span>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {feedback && (
          <div className={`absolute top-1/4 text-6xl font-black tracking-tighter animate-bounce ${feedback === 'HIT!' ? 'text-cyan-400' : 'text-zinc-500'}`}>
            {feedback}
          </div>
        )}

        <div className="w-full max-w-lg space-y-6">
           {/* Decorative HUD Elements */}
           <div className="flex justify-between text-xs opacity-50 uppercase text-cyan-600">
              <span>Sys.Load: 98%</span>
              <span>Net.Lat: 12ms</span>
           </div>

           <div className="border border-cyan-900/50 bg-black/50 p-6 rounded relative group shadow-[0_0_20px_rgba(8,145,178,0.1)]">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>

              {isStealth ? (
                // STEALTH FORM
                <div className="space-y-4">
                  <div className="text-center mb-4">
                      <Zap className="mx-auto mb-2 text-cyan-600 opacity-50" size={48} />
                      <h3 className="text-cyan-500 tracking-widest text-sm uppercase">Manual Override</h3>
                   </div>

                   {/* Chat Log */}
                   <div className="bg-black/80 border border-cyan-900/50 p-4 rounded h-64 overflow-y-auto font-mono text-sm shadow-inner mb-4">
                    {messages.length === 0 && (
                      <div className="text-cyan-900 text-center mt-20 opacity-50">NO LOGS DETECTED</div>
                    )}
                    {messages.map((msg, idx) => (
                      <div key={idx} className="mb-2">
                        <span className={msg.role === 'user' ? 'text-cyan-400' : 'text-green-400'}>
                          {msg.role === 'user' ? '> [STUDENT]:' : '> [SYSTEM]:'}
                        </span>
                        <span className="ml-2 text-cyan-100/90">{msg.text}</span>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="mb-2 animate-pulse">
                         <span className="text-green-400">{'> [SYSTEM]:'}</span>
                         <span className="ml-2 text-cyan-100/90">. . .</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                   </div>

                   <form onSubmit={handleStealthSubmit}>
                    <input
                      type="text"
                      value={inputChat}
                      onChange={(e) => setInputChat(e.target.value)}
                      className="w-full bg-zinc-950 border border-cyan-900 text-cyan-100 p-4 text-center text-lg focus:outline-none focus:border-cyan-500 transition-colors uppercase placeholder-cyan-900/50 shadow-inner mb-4"
                      placeholder="ENTER COMMAND SEQUENCE..."
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-900 text-cyan-400 py-3 rounded uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Execute
                    </button>
                   </form>
                </div>
              ) : (
                // GAME FORM
                <form onSubmit={handleGameSubmit} className="space-y-4">
                   <div className="text-center mb-4">
                      <Shield className="mx-auto mb-2 text-cyan-600 opacity-50" size={48} />
                      <h3 className="text-cyan-500 tracking-widest text-sm uppercase">Weapon Systems Active</h3>
                   </div>
                   <input
                    type="text"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    className="w-full bg-zinc-950 border border-cyan-900 text-cyan-100 p-4 text-center text-2xl font-bold focus:outline-none focus:border-cyan-500 transition-colors placeholder-cyan-900/50 shadow-inner"
                    placeholder="ENTER CODE..."
                    autoComplete="off"
                    inputMode="numeric"
                   />
                   <button
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(8,145,178,0.5)] hover:shadow-[0_0_25px_rgba(34,211,238,0.7)]"
                   >
                    FIRE WEAPON
                   </button>
                </form>
              )}
           </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-2 text-center text-[10px] opacity-30 uppercase tracking-widest text-cyan-700">
        Zera-Pilot v0.1.4 // Build 2024.10 // {view === 'stealth' ? 'SECURE CHANNEL' : 'PUBLIC CHANNEL'}
      </div>
    </div>
  );
}
