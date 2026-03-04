"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { F1_DRIVERS_2026, F1_TEAMS_2026 } from "@/lib/f1-data";

type ScoreBreakdown = {
  driver1Points: number;
  driver2Points: number;
  driver3Points: number;
  driver4Points: number;
  driver5Points: number;
  polePoints: number;
  team1Points: number;
  team2Points: number;
  team3Points: number;
  fastestLapPoints: number;
  total: number;
};

type PredictionEntry = {
  id: string;
  raceName: string;
  driver1?: string | null;
  driver2?: string | null;
  driver3?: string | null;
  driver4?: string | null;
  driver5?: string | null;
  pole?: string | null;
  team1?: string | null;
  team2?: string | null;
  team3?: string | null;
  fastestLap?: string | null;
  points?: number | null;
  scoreBreakdown?: string | null;
  createdAt: string;
};

type ProfileData = {
  id: string;
  name?: string | null;
  email?: string;
  favoriteTeam?: string | null;
  favoriteDriver?: string | null;
  totalPoints: number;
  leaderboardPosition: number;
  percentCorrect: number;
  predictions: PredictionEntry[];
};

function getDriverColor(points: number | undefined, predDriver: string | null | undefined): string {
  if (!predDriver) return "transparent";
  if (points === undefined) return "transparent";
  if (points === 2) return "#16a34a"; // bright green - exact
  if (points === 1) return "#4ade80"; // light green - close
  return "#9ca3af"; // grey - wrong
}

function getTeamColor(points: number | undefined, predTeam: string | null | undefined): string {
  if (!predTeam) return "transparent";
  if (points === undefined) return "transparent";
  if (points === 1) return "#16a34a";
  return "#9ca3af";
}

function PredictionCard({ pred, isSelf }: { pred: PredictionEntry; isSelf: boolean }) {
  const breakdown: ScoreBreakdown | null = pred.scoreBreakdown
    ? JSON.parse(pred.scoreBreakdown)
    : null;

  const isScored = pred.points !== null && pred.points !== undefined;

  return (
    <div
      className="rounded-lg p-4 text-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
          {pred.raceName.replace(" Grand Prix", " GP")}
        </h4>
        {isScored ? (
          <div
            className="px-2 py-1 rounded-full text-xs font-bold"
            style={{ background: "var(--f1-red)", color: "white" }}
          >
            {pred.points} pts
          </div>
        ) : (
          <div
            className="px-2 py-1 rounded-full text-xs"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
          >
            Pending
          </div>
        )}
      </div>

      {/* Top 5 drivers */}
      <div className="mb-3">
        <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Top 5
        </p>
        <div className="space-y-1">
          {[
            { pos: 1, driver: pred.driver1, pts: breakdown?.driver1Points },
            { pos: 2, driver: pred.driver2, pts: breakdown?.driver2Points },
            { pos: 3, driver: pred.driver3, pts: breakdown?.driver3Points },
            { pos: 4, driver: pred.driver4, pts: breakdown?.driver4Points },
            { pos: 5, driver: pred.driver5, pts: breakdown?.driver5Points },
          ].map(({ pos, driver, pts }) => (
            <div
              key={pos}
              className="flex items-center gap-2 px-2 py-1 rounded text-xs"
              style={{
                background: isScored && driver
                  ? `${getDriverColor(pts, driver)}22`
                  : "transparent",
                borderLeft: isScored && driver
                  ? `3px solid ${getDriverColor(pts, driver)}`
                  : "3px solid var(--border)",
              }}
            >
              <span className="font-bold w-4" style={{ color: "var(--muted)" }}>P{pos}</span>
              <span style={{ color: "var(--foreground)" }}>{driver || "—"}</span>
              {isScored && pts !== undefined && (
                <span className="ml-auto font-bold" style={{ color: "var(--muted)" }}>
                  {pts}pt
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pole */}
      <div className="mb-3">
        <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Pole
        </p>
        <div
          className="flex items-center gap-2 px-2 py-1 rounded text-xs"
          style={{
            background: isScored && pred.pole
              ? `${getDriverColor(breakdown?.polePoints, pred.pole)}22`
              : "transparent",
            borderLeft: isScored && pred.pole
              ? `3px solid ${getDriverColor(breakdown?.polePoints, pred.pole)}`
              : "3px solid var(--border)",
          }}
        >
          <span style={{ color: "var(--foreground)" }}>{pred.pole || "—"}</span>
          {isScored && breakdown?.polePoints !== undefined && (
            <span className="ml-auto font-bold" style={{ color: "var(--muted)" }}>
              {breakdown.polePoints}pt
            </span>
          )}
        </div>
      </div>

      {/* Top 3 Teams */}
      <div className="mb-3">
        <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Top 3 Teams
        </p>
        <div className="space-y-1">
          {[
            { pos: 1, team: pred.team1, pts: breakdown?.team1Points },
            { pos: 2, team: pred.team2, pts: breakdown?.team2Points },
            { pos: 3, team: pred.team3, pts: breakdown?.team3Points },
          ].map(({ pos, team, pts }) => (
            <div
              key={pos}
              className="flex items-center gap-2 px-2 py-1 rounded text-xs"
              style={{
                background: isScored && team
                  ? `${getTeamColor(pts, team)}22`
                  : "transparent",
                borderLeft: isScored && team
                  ? `3px solid ${getTeamColor(pts, team)}`
                  : "3px solid var(--border)",
              }}
            >
              <span className="font-bold w-4" style={{ color: "var(--muted)" }}>P{pos}</span>
              <span style={{ color: "var(--foreground)" }}>{team || "—"}</span>
              {isScored && pts !== undefined && (
                <span className="ml-auto font-bold" style={{ color: "var(--muted)" }}>
                  {pts}pt
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fastest Lap */}
      <div>
        <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Fastest Lap
        </p>
        <div
          className="flex items-center gap-2 px-2 py-1 rounded text-xs"
          style={{
            background: isScored && pred.fastestLap
              ? `${getTeamColor(breakdown?.fastestLapPoints, pred.fastestLap)}22`
              : "transparent",
            borderLeft: isScored && pred.fastestLap
              ? `3px solid ${getTeamColor(breakdown?.fastestLapPoints, pred.fastestLap)}`
              : "3px solid var(--border)",
          }}
        >
          <span style={{ color: "var(--foreground)" }}>{pred.fastestLap || "—"}</span>
          {isScored && breakdown?.fastestLapPoints !== undefined && (
            <span className="ml-auto font-bold" style={{ color: "var(--muted)" }}>
              {breakdown.fastestLapPoints}pt
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileView({
  userId,
  isSelf,
  onClose,
}: {
  userId: string;
  isSelf: boolean;
  onClose?: () => void;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFavTeam, setEditFavTeam] = useState("");
  const [editFavDriver, setEditFavDriver] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const url = isSelf
        ? "/api/user/profile"
        : `/api/user/profile?userId=${userId}`;
      const res = await fetch(url);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProfile(data);
      setEditName(data.name || "");
      setEditFavTeam(data.favoriteTeam || "");
      setEditFavDriver(data.favoriteDriver || "");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId, isSelf]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const body: Record<string, string> = {
        name: editName,
        favoriteTeam: editFavTeam,
        favoriteDriver: editFavDriver,
      };

      if (changingPassword) {
        if (newPass !== confirmPass) {
          setSaveError("Passwords do not match");
          setSaving(false);
          return;
        }
        if (newPass.length < 6) {
          setSaveError("Password must be at least 6 characters");
          setSaving(false);
          return;
        }
        body.currentPassword = currentPass;
        body.newPassword = newPass;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Failed to save");
        return;
      }

      setSaveSuccess("Profile updated!");
      setEditing(false);
      setChangingPassword(false);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      fetchProfile();
      setTimeout(() => setSaveSuccess(""), 3000);
    } catch {
      setSaveError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="animate-spin w-8 h-8 border-2 rounded-full"
          style={{ borderColor: "var(--f1-red)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8" style={{ color: "var(--muted)" }}>
        Profile not found.
      </div>
    );
  }

  const displayName = profile.name || profile.email?.split("@")[0] || "Anonymous";

  return (
    <div className="max-w-xl mx-auto">
      {/* Header stats */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{ background: "var(--f1-dark)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white text-2xl font-black">{displayName}</h2>
            {isSelf && profile.email && (
              <p className="text-white/50 text-sm">{profile.email}</p>
            )}
          </div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white"
            style={{ background: "var(--f1-red)" }}
          >
            {displayName[0]?.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-white text-2xl font-black">{profile.totalPoints}</div>
            <div className="text-white/50 text-xs">Total Points</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-black">#{profile.leaderboardPosition}</div>
            <div className="text-white/50 text-xs">Rank</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-black">{profile.percentCorrect}%</div>
            <div className="text-white/50 text-xs">Accurate</div>
          </div>
        </div>

        {/* Favorites */}
        {(profile.favoriteTeam || profile.favoriteDriver) && (
          <div className="mt-4 pt-4 border-t border-white/10 flex gap-4">
            {profile.favoriteTeam && (
              <div>
                <p className="text-white/50 text-xs mb-0.5">Fav Team</p>
                <p className="text-white text-sm font-semibold">{profile.favoriteTeam}</p>
              </div>
            )}
            {profile.favoriteDriver && (
              <div>
                <p className="text-white/50 text-xs mb-0.5">Fav Driver</p>
                <p className="text-white text-sm font-semibold">{profile.favoriteDriver}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Own profile: edit controls */}
      {isSelf && (
        <div className="mb-6 space-y-3">
          {saveSuccess && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "#DCFCE7", color: "#166534" }}>
              ✓ {saveSuccess}
            </div>
          )}

          {!editing ? (
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                ✎ Edit Profile
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--f1-red)", color: "white" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4 rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Edit Profile</h3>

              {saveError && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Favorite Team</label>
                <select
                  value={editFavTeam}
                  onChange={(e) => setEditFavTeam(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >
                  <option value="">None</option>
                  {F1_TEAMS_2026.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Favorite Driver</label>
                <select
                  value={editFavDriver}
                  onChange={(e) => setEditFavDriver(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >
                  <option value="">None</option>
                  {F1_DRIVERS_2026.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setChangingPassword(!changingPassword)}
                  className="text-sm font-medium hover:underline"
                  style={{ color: "var(--f1-red)" }}
                >
                  {changingPassword ? "▼ Cancel Password Change" : "▶ Change Password"}
                </button>

                {changingPassword && (
                  <div className="mt-3 space-y-3">
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="Current password"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                    />
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="New password"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                    />
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all"
                  style={{ background: "var(--f1-red)" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setChangingPassword(false); setSaveError(""); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                  style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Past predictions */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
          Past Predictions
        </h3>

        {profile.predictions.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center text-sm"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            No predictions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {profile.predictions.map((pred) => (
              <PredictionCard key={pred.id} pred={pred} isSelf={isSelf} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
