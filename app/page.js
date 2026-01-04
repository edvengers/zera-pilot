import Link from "next/link";
import { Gamepad2, Shield } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-4">
      {/* Title */}
      <h1 className="mb-12 text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 text-center uppercase drop-shadow-2xl">
        Project Zera
      </h1>

      {/* Button Container */}
      <div className="flex flex-col gap-6 w-full max-w-md">

        {/* Student Login Button - Primary Action */}
        <Link
          href="/student"
          className="group flex items-center justify-center gap-4 w-full p-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 border-2 border-indigo-400/30 transition-all duration-200 hover:scale-[1.02] shadow-xl shadow-indigo-900/20"
        >
          <Gamepad2 className="w-8 h-8 text-indigo-100 group-hover:rotate-12 transition-transform" />
          <span className="text-2xl font-bold text-white tracking-wide">
            Student Login
          </span>
        </Link>

        {/* Teacher Login Button - Secondary Action */}
        <Link
          href="/teacher"
          className="group flex items-center justify-center gap-3 w-full p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-slate-600 transition-all duration-200"
        >
          <Shield className="w-6 h-6 text-slate-400 group-hover:text-slate-200 transition-colors" />
          <span className="text-xl font-bold text-slate-200 group-hover:text-white transition-colors">
            Teacher Login
          </span>
        </Link>

      </div>
    </main>
  );
}
