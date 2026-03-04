"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import { getNextSession } from "@/lib/race-schedule";

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [sessionInfo, setSessionInfo] = useState<{
    raceName: string;
    sessionName: string;
  } | null>(null);

  useEffect(() => {
    function update() {
      const next = getNextSession();
      if (!next) {
        setTimeLeft("Season Over");
        setSessionInfo(null);
        return;
      }

      setSessionInfo({ raceName: next.raceName, sessionName: next.sessionName });

      const diff = new Date(next.sessionTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("LIVE NOW");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!sessionInfo) return null;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-xs font-medium opacity-80 truncate max-w-[200px]">
        {sessionInfo.raceName.replace(" Grand Prix", " GP")} — {sessionInfo.sessionName}
      </div>
      <div className="text-sm font-bold tabular-nums" style={{ color: "var(--f1-red)" }}>
        {timeLeft}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "var(--f1-dark)",
        borderColor: "var(--f1-red)",
        borderBottomWidth: "3px",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div
              className="text-white font-black text-xl tracking-wider"
              style={{ letterSpacing: "0.15em" }}
            >
              F1
            </div>
            <div className="text-white font-semibold text-sm hidden sm:block opacity-80">
              PREDICTIONS
            </div>
          </Link>

          {/* Center: Countdown */}
          <div className="flex-1 flex justify-center px-4">
            <div className="text-white hidden sm:block">
              <CountdownTimer />
            </div>
          </div>

          {/* Right: Nav Links */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-white text-sm font-medium hover:text-red-400 transition-colors"
            >
              Home
            </Link>

            <a
              href="https://f1live.dpdns.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "var(--f1-red)" }}
            >
              <span className="animate-pulse">●</span> Watch Live
            </a>

            {status === "loading" ? (
              <div className="text-white text-sm opacity-50">...</div>
            ) : session ? (
              <>
                <Link
                  href="/profile"
                  className="text-white text-sm font-medium hover:text-red-400 transition-colors"
                >
                  {session.user?.name || session.user?.email?.split("@")[0] || "Profile"}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-white text-sm font-medium hover:text-red-400 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-white text-sm font-medium hover:text-red-400 transition-colors"
              >
                Log In
              </Link>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="text-white p-1 rounded hover:bg-white/10 transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12"/>
              ) : (
                <>
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile countdown */}
        <div className="sm:hidden pb-2 text-white">
          <CountdownTimer />
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-3 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--f1-dark)" }}
        >
          <Link
            href="/"
            className="block text-white text-sm font-medium"
            onClick={() => setMobileOpen(false)}
          >
            Home
          </Link>
          <a
            href="https://f1live.dpdns.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-white text-sm font-bold"
            onClick={() => setMobileOpen(false)}
          >
            ● Watch Live
          </a>
          {session ? (
            <>
              <Link
                href="/profile"
                className="block text-white text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block text-white text-sm font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block text-white text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Log In
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="text-white text-sm font-medium"
          >
            {theme === "dark" ? "☀ Light Mode" : "☾ Dark Mode"}
          </button>
        </div>
      )}
    </nav>
  );
}
