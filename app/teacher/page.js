'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function TeacherDashboard() {
  const [inputMaxHp, setInputMaxHp] = useState(100);
  const [answerKey, setAnswerKey] = useState('');
  const [bossData, setBossData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Listen to the live session
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sessions', 'live'), (docSnap) => {
      if (docSnap.exists()) {
        setBossData(docSnap.data());
      } else {
        setBossData(null);
      }
    });
    return () => unsub();
  }, []);

  // Listen to alerts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      const newAlerts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlerts(newAlerts);
    });
    return () => unsub();
  }, []);

  const handleStartRaid = async (e) => {
    e.preventDefault();
    try {
      const hp = Number(inputMaxHp);
      await setDoc(doc(db, 'sessions', 'live'), {
        maxHp: hp,
        current_hp: hp,
        answerKey: answerKey,
      });
      alert('Raid started successfully!');
    } catch (error) {
      console.error('Error starting raid:', error);
      alert('Failed to start raid.');
    }
  };

  // Calculate health percentage
  const hpPercentage =
    bossData && bossData.maxHp > 0
      ? Math.max(0, (bossData.current_hp / bossData.maxHp) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-wider text-red-500 uppercase">
            Command Center
          </h1>
        </header>

        {/* Setup Form */}
        <section className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Raid Setup</h2>
          <form onSubmit={handleStartRaid} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxHp" className="block text-sm font-medium mb-1 text-gray-400">
                  Boss Max HP
                </label>
                <input
                  id="maxHp"
                  type="number"
                  value={inputMaxHp}
                  onChange={(e) => setInputMaxHp(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="answerKey" className="block text-sm font-medium mb-1 text-gray-400">
                  Answer Key
                </label>
                <input
                  id="answerKey"
                  type="text"
                  value={answerKey}
                  onChange={(e) => setAnswerKey(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. SECRET123"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 uppercase tracking-widest"
            >
              Start Raid
            </button>
          </form>
        </section>

        {/* Boss Health Bar */}
        <section className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-green-400">Boss Status</h2>
          {bossData ? (
            <div>
              <div className="flex justify-between mb-2 text-sm font-mono text-gray-300">
                <span>HP: {bossData.current_hp} / {bossData.maxHp}</span>
                <span>{hpPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 h-12 rounded-full overflow-hidden border-2 border-gray-600 relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500 ease-out"
                  style={{ width: `${hpPercentage}%` }}
                />
                {/* Stripe effect overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InN0cmlwZXMiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMzAgMEg0MEwwIDQwaDMwTDAgNDBaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjc3RyaXBlcykiLz48L3N2Zz4=')] opacity-30"></div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No active raid session found.</p>
          )}
        </section>

        {/* Risk Shield List */}
        <section className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-400 flex items-center gap-2">
            <span>Risk Shield List</span>
            {alerts.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {alerts.length}
              </span>
            )}
          </h2>
          {alerts.length === 0 ? (
            <p className="text-gray-500 italic">No active alerts.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-gray-900 border border-red-900/50 p-4 rounded flex items-center justify-between"
                >
                  <span className="text-red-500 font-bold text-lg truncate">
                    {alert.studentName || 'Unknown Student'}
                  </span>
                  {alert.reason && (
                    <span className="text-xs text-gray-500 ml-2">{alert.reason}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
