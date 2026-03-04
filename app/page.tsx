import PredictionForm from "@/components/PredictionForm";
import Leaderboard from "@/components/Leaderboard";

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* Page header */}
      <div
        className="border-b py-6 px-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>
            2026 F1 Season Predictions
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Predict race results, earn points, climb the leaderboard
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Prediction Form */}
          <div>
            <PredictionForm />
          </div>

          {/* Right: Leaderboard */}
          <div>
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
