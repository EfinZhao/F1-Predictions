"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { F1_DRIVERS_2026, F1_TEAMS_2026 } from "@/lib/f1-data";

type Prediction = {
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
};

type FormState = {
  driver1: string;
  driver2: string;
  driver3: string;
  driver4: string;
  driver5: string;
  pole: string;
  team1: string;
  team2: string;
  team3: string;
  fastestLap: string;
};

type RaceInfo = {
  raceName: string;
  schedule: {
    "practice 1": string;
    Race: string;
    RaceEnd: string;
  };
  prediction: Prediction | null;
  isLocked: boolean;
};

function DriverSelect({
  label,
  value,
  onChange,
  disabled,
  exclude,
  position,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  exclude: string[];
  position?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
        style={{ background: "var(--f1-red)" }}
      >
        {position ?? "P"}
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
          style={{
            background: "var(--surface)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          <option value="">Select driver...</option>
          {F1_DRIVERS_2026.map((d) => (
            <option key={d} value={d} disabled={exclude.includes(d) && value !== d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TeamSelect({
  label,
  value,
  onChange,
  disabled,
  exclude,
  position,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  exclude: string[];
  position?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
        style={{ background: "var(--f1-dark)" }}
      >
        {position ?? "P"}
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
          style={{
            background: "var(--surface)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          <option value="">Select team...</option>
          {F1_TEAMS_2026.map((t) => (
            <option key={t} value={t} disabled={exclude.includes(t) && value !== t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function PredictionForm() {
  const { data: session, status } = useSession();
  const [raceInfo, setRaceInfo] = useState<RaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    driver1: "",
    driver2: "",
    driver3: "",
    driver4: "",
    driver5: "",
    pole: "",
    team1: "",
    team2: "",
    team3: "",
    fastestLap: "",
  });

  const fetchRaceInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRaceInfo(data);

      if (data.prediction) {
        setForm({
          driver1: data.prediction.driver1 || "",
          driver2: data.prediction.driver2 || "",
          driver3: data.prediction.driver3 || "",
          driver4: data.prediction.driver4 || "",
          driver5: data.prediction.driver5 || "",
          pole: data.prediction.pole || "",
          team1: data.prediction.team1 || "",
          team2: data.prediction.team2 || "",
          team3: data.prediction.team3 || "",
          fastestLap: data.prediction.fastestLap || "",
        });
      }
    } catch {
      setError("Failed to load race data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRaceInfo();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchRaceInfo]);

  // Recheck lock status every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (raceInfo) {
        const isLocked =
          Date.now() >=
          new Date(raceInfo.schedule["practice 1"]).getTime();
        if (isLocked !== raceInfo.isLocked) {
          setRaceInfo((prev) => prev ? { ...prev, isLocked } : null);
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [raceInfo]);

  const isLocked = raceInfo
    ? Date.now() >= new Date(raceInfo.schedule["practice 1"]).getTime()
    : true;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked || !raceInfo) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceName: raceInfo.raceName, ...form }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save prediction");
    } finally {
      setSaving(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="text-4xl mb-4">🏎️</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Make Your Predictions
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Log in to predict race results and earn points!
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ background: "var(--f1-red)" }}
        >
          Log In to Predict
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="rounded-xl p-8 flex items-center justify-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="animate-spin w-8 h-8 border-2 rounded-full border-t-transparent" style={{ borderColor: "var(--f1-red)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!raceInfo) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p style={{ color: "var(--muted)" }}>No upcoming races found.</p>
      </div>
    );
  }

  const drivers = [form.driver1, form.driver2, form.driver3, form.driver4, form.driver5].filter(Boolean) as string[];
  const teams = [form.team1, form.team2, form.team3].filter(Boolean) as string[];

  const raceDate = new Date(raceInfo.schedule.Race).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ background: "var(--f1-dark)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">{raceInfo.raceName}</h2>
            <p className="text-white/60 text-xs mt-0.5">Race: {raceDate}</p>
          </div>
          {isLocked ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "#7F1D1D", color: "#FCA5A5" }}
            >
              🔒 Locked
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "#14532D", color: "#86EFAC" }}
            >
              ✓ Open
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-6">
        {isLocked && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}
          >
            🔒 Predictions are locked — Practice 1 has started or the race weekend is underway.
          </div>
        )}

        {/* Top 5 Drivers */}
        <div>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--f1-red)" }}>
            Top 5 Finishers
          </h3>
          <div className="space-y-3">
            <DriverSelect label="P1 Winner" value={form.driver1} onChange={(v) => setForm({ ...form, driver1: v })} disabled={isLocked} exclude={[form.driver2, form.driver3, form.driver4, form.driver5].filter(Boolean) as string[]} position={1} />
            <DriverSelect label="P2 Finisher" value={form.driver2} onChange={(v) => setForm({ ...form, driver2: v })} disabled={isLocked} exclude={[form.driver1, form.driver3, form.driver4, form.driver5].filter(Boolean) as string[]} position={2} />
            <DriverSelect label="P3 Finisher" value={form.driver3} onChange={(v) => setForm({ ...form, driver3: v })} disabled={isLocked} exclude={[form.driver1, form.driver2, form.driver4, form.driver5].filter(Boolean) as string[]} position={3} />
            <DriverSelect label="P4 Finisher" value={form.driver4} onChange={(v) => setForm({ ...form, driver4: v })} disabled={isLocked} exclude={[form.driver1, form.driver2, form.driver3, form.driver5].filter(Boolean) as string[]} position={4} />
            <DriverSelect label="P5 Finisher" value={form.driver5} onChange={(v) => setForm({ ...form, driver5: v })} disabled={isLocked} exclude={[form.driver1, form.driver2, form.driver3, form.driver4].filter(Boolean) as string[]} position={5} />
          </div>
        </div>

        {/* Pole Position */}
        <div>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--f1-red)" }}>
            Pole Position
          </h3>
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{ background: "var(--f1-red)" }}
            >
              P
            </div>
            <div className="flex-1">
              <select
                value={form.pole}
                onChange={(e) => setForm({ ...form, pole: e.target.value })}
                disabled={isLocked}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                style={{
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                <option value="">Select pole sitter...</option>
                {F1_DRIVERS_2026.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Top 3 Teams */}
        <div>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--f1-red)" }}>
            Top 3 Teams (Constructors)
          </h3>
          <div className="space-y-3">
            <TeamSelect label="1st Team" value={form.team1} onChange={(v) => setForm({ ...form, team1: v })} disabled={isLocked} exclude={[form.team2, form.team3].filter(Boolean) as string[]} position={1} />
            <TeamSelect label="2nd Team" value={form.team2} onChange={(v) => setForm({ ...form, team2: v })} disabled={isLocked} exclude={[form.team1, form.team3].filter(Boolean) as string[]} position={2} />
            <TeamSelect label="3rd Team" value={form.team3} onChange={(v) => setForm({ ...form, team3: v })} disabled={isLocked} exclude={[form.team1, form.team2].filter(Boolean) as string[]} position={3} />
          </div>
        </div>

        {/* Fastest Lap */}
        <div>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--f1-red)" }}>
            Fastest Lap
          </h3>
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{ background: "#7C3AED" }}
            >
              ⚡
            </div>
            <div className="flex-1">
              <select
                value={form.fastestLap}
                onChange={(e) => setForm({ ...form, fastestLap: e.target.value })}
                disabled={isLocked}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                style={{
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                <option value="">Select driver...</option>
                {F1_DRIVERS_2026.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{ background: "#FEE2E2", color: "#991B1B" }}
          >
            {error}
          </div>
        )}

        {saved && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{ background: "#DCFCE7", color: "#166534" }}
          >
            ✓ Prediction saved successfully!
          </div>
        )}

        {!isLocked && (
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--f1-red)" }}
          >
            {saving ? "Saving..." : "Save Prediction"}
          </button>
        )}

        {/* Points guide */}
        <div
          className="mt-4 p-4 rounded-lg text-xs space-y-1"
          style={{ background: "var(--surface)", color: "var(--muted)" }}
        >
          <p className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>Scoring Guide:</p>
          <p>• Top 5 drivers: <span className="font-medium text-green-600">2pts</span> exact, <span className="font-medium text-yellow-600">1pt</span> within ±1 position</p>
          <p>• Pole position: <span className="font-medium text-green-600">2pts</span> exact</p>
          <p>• Top 3 teams: <span className="font-medium text-green-600">1pt</span> per exact position</p>
          <p>• Fastest lap: <span className="font-medium text-green-600">1pt</span> exact</p>
          <p className="font-semibold mt-2">Max: 16 points per race</p>
        </div>
      </form>
    </div>
  );
}
