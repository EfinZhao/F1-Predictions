"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ProfileView from "./ProfileView";

type LeaderboardEntry = {
  id: string;
  name: string;
  email: string;
  favoriteTeam?: string | null;
  favoriteDriver?: string | null;
  totalPoints: number;
};

export default function Leaderboard() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    isSelf: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  function getMedal(rank: number) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{ background: "var(--f1-dark)" }}
        >
          <h2 className="text-white font-bold text-lg">Leaderboard</h2>
          <p className="text-white/50 text-xs mt-0.5">2026 Season</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="animate-spin w-8 h-8 border-2 rounded-full"
              style={{ borderColor: "var(--f1-red)", borderTopColor: "transparent" }}
            />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--muted)" }}>
            No participants yet. Be the first to predict!
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {entries.map((entry, idx) => {
              const rank = idx + 1;
              const isCurrentUser = session?.user?.id === entry.id;
              const medal = getMedal(rank);

              return (
                <button
                  key={entry.id}
                  onClick={() =>
                    setSelectedUser({ id: entry.id, isSelf: isCurrentUser })
                  }
                  className="w-full flex items-center gap-4 px-6 py-3.5 text-left transition-all hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    background: isCurrentUser
                      ? "var(--surface)"
                      : "transparent",
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 text-center">
                    {medal ? (
                      <span className="text-lg">{medal}</span>
                    ) : (
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--muted)" }}
                      >
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ background: isCurrentUser ? "var(--f1-red)" : "var(--f1-grey)" }}
                  >
                    {entry.name[0]?.toUpperCase()}
                  </div>

                  {/* Name + favorites */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold text-sm truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        {entry.name}
                      </span>
                      {isCurrentUser && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--f1-red)", color: "white" }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    {(entry.favoriteTeam || entry.favoriteDriver) && (
                      <div
                        className="text-xs truncate"
                        style={{ color: "var(--muted)" }}
                      >
                        {entry.favoriteDriver && `🏎 ${entry.favoriteDriver}`}
                        {entry.favoriteDriver && entry.favoriteTeam && " · "}
                        {entry.favoriteTeam && `🏆 ${entry.favoriteTeam}`}
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <div
                      className="text-lg font-black"
                      style={{ color: rank <= 3 ? "var(--f1-red)" : "var(--foreground)" }}
                    >
                      {entry.totalPoints}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      pts
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedUser(null);
          }}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ background: "var(--background)" }}
          >
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
            >
              ✕
            </button>
            <div className="p-6">
              <ProfileView
                userId={selectedUser.id}
                isSelf={selectedUser.isSelf}
                onClose={() => setSelectedUser(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
