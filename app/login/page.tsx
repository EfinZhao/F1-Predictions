"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto-login after register
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError("Registered but login failed. Please log in manually.");
        setMode("login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="px-8 py-6 text-center"
          style={{ background: "var(--f1-dark)" }}
        >
          <div className="text-white font-black text-3xl tracking-widest mb-1">
            F1
          </div>
          <div className="text-white/70 text-sm font-medium tracking-wider uppercase">
            Predictions 2026
          </div>
        </div>

        {/* Tab switcher */}
        <div
          className="flex"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className="flex-1 py-3 text-sm font-semibold transition-all"
            style={{
              color: mode === "login" ? "var(--f1-red)" : "var(--muted)",
              borderBottom: mode === "login" ? "2px solid var(--f1-red)" : "2px solid transparent",
            }}
          >
            Log In
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className="flex-1 py-3 text-sm font-semibold transition-all"
            style={{
              color: mode === "register" ? "var(--f1-red)" : "var(--muted)",
              borderBottom: mode === "register" ? "2px solid var(--f1-red)" : "2px solid transparent",
            }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: "#FEE2E2", color: "#991B1B" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "var(--surface)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--f1-red)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--f1-red)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--f1-red)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "var(--surface)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--f1-red)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: "var(--f1-red)" }}
            >
              {loading ? "Loading..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm" style={{ color: "var(--muted)" }}>
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className="font-medium hover:underline"
                  style={{ color: "var(--f1-red)" }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="font-medium hover:underline"
                  style={{ color: "var(--f1-red)" }}
                >
                  Log In
                </button>
              </>
            )}
          </p>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs hover:underline" style={{ color: "var(--muted)" }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
