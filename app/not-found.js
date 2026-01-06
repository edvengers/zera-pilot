import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-4 text-white">
      <h2 className="mb-4 text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 uppercase drop-shadow-2xl">
        404 - Not Found
      </h2>
      <p className="mb-8 text-xl text-slate-400">Could not find requested resource</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all duration-200 hover:scale-105"
      >
        Return Home
      </Link>
    </div>
  );
}
