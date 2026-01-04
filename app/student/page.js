"use client";

import { useState, useEffect } from "react";
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

    try {
      await addDoc(collection(db, "alerts"), {
        student_name: studentName,
        type: "chat",
        message: inputChat,
        timestamp: serverTimestamp(),
      });
      setInputChat("");
      // Fake feedback to maintain illusion
      setFeedback("COMMAND SENT");
      setTimeout(() => setFeedback(null), 1000);
    } catch (err) {
      console.error("Error sending chat:", err);
    }
  };

  // --- Views ---

  if (view === "login") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4">
        <div className="border border-green-800 p-8 rounded-lg shadow-lg shadow-green-900/20 w-full max-w-md bg-zinc-950">
          <h1 className="text-2xl mb-6 text-center tracking-widest uppercase border-b border-green-900 pb-2">
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
                className="w-full bg-black border border-green-700 text-green-400 p-3 rounded focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all placeholder-green-900"
                placeholder="Name..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-900 hover:bg-green-800 text-green-100 py-3 rounded uppercase tracking-wider font-bold transition-colors"
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
  const hudColor = isStealth ? "blue" : "red"; // Subtle internal difference maybe? Or keep them identical as requested.
  // Request said: "Stealth Mode: It should look exactly like the Game Mode (dark, techy) so peers don't notice."
  // So I will use the same layout.

  return (
    <div className="min-h-screen bg-black text-red-500 font-mono flex flex-col relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#330000 1px, transparent 1px), linear-gradient(90deg, #330000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* Header HUD */}
      <div className="p-4 border-b border-red-900 flex justify-between items-center bg-zinc-950/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs tracking-[0.2em] uppercase">
            {studentName} :: Linked
          </span>
        </div>
        <div className="text-xl font-bold flex items-center gap-2">
          <Skull size={20} />
          <span>BOSS HP: {hp}</span>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {feedback && (
          <div className={`absolute top-1/4 text-6xl font-black tracking-tighter animate-bounce ${feedback === 'HIT!' ? 'text-red-500' : 'text-zinc-500'}`}>
            {feedback}
          </div>
        )}

        <div className="w-full max-w-lg space-y-6">
           {/* Decorative HUD Elements */}
           <div className="flex justify-between text-xs opacity-50 uppercase">
              <span>Sys.Load: 98%</span>
              <span>Net.Lat: 12ms</span>
           </div>

           <div className="border border-red-900/50 bg-black/50 p-6 rounded relative group">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500"></div>

              {isStealth ? (
                // STEALTH FORM
                <form onSubmit={handleStealthSubmit} className="space-y-4">
                   <div className="text-center mb-4">
                      <Zap className="mx-auto mb-2 text-red-700 opacity-50" size={48} />
                      <h3 className="text-red-400 tracking-widest text-sm uppercase">Manual Override</h3>
                   </div>
                   <input
                    type="text"
                    value={inputChat}
                    onChange={(e) => setInputChat(e.target.value)}
                    className="w-full bg-zinc-950 border border-red-900 text-red-100 p-4 text-center text-lg focus:outline-none focus:border-red-500 transition-colors uppercase placeholder-red-900/50"
                    placeholder="ENTER COMMAND SEQUENCE..."
                    autoComplete="off"
                   />
                   <button
                    type="submit"
                    className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-900 text-red-500 py-3 rounded uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                   >
                    Execute
                   </button>
                </form>
              ) : (
                // GAME FORM
                <form onSubmit={handleGameSubmit} className="space-y-4">
                   <div className="text-center mb-4">
                      <Shield className="mx-auto mb-2 text-red-700 opacity-50" size={48} />
                      <h3 className="text-red-400 tracking-widest text-sm uppercase">Weapon Systems Active</h3>
                   </div>
                   <input
                    type="text"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    className="w-full bg-zinc-950 border border-red-900 text-red-100 p-4 text-center text-2xl font-bold focus:outline-none focus:border-red-500 transition-colors placeholder-red-900/50"
                    placeholder="ENTER CODE..."
                    autoComplete="off"
                    inputMode="numeric"
                   />
                   <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-500 text-black font-bold py-3 rounded uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)]"
                   >
                    FIRE WEAPON
                   </button>
                </form>
              )}
           </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-2 text-center text-[10px] opacity-30 uppercase tracking-widest">
        Zera-Pilot v0.1.4 // Build 2024.10 // {view === 'stealth' ? 'SECURE CHANNEL' : 'PUBLIC CHANNEL'}
      </div>
    </div>
  );
}
