import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/lib/scoring";
import raceSchedule from "@/2026_race_schedule.json";

type RaceScheduleEntry = {
  "practice 1": string;
  RaceEnd: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { raceName } = body;

    if (!raceName) {
      return NextResponse.json(
        { error: "Race name required" },
        { status: 400 }
      );
    }

    const schedule = (raceSchedule as Record<string, RaceScheduleEntry>)[raceName];
    if (!schedule) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    const raceEndTime = new Date(schedule.RaceEnd).getTime();
    if (Date.now() < raceEndTime) {
      return NextResponse.json(
        { error: "Race has not ended yet" },
        { status: 400 }
      );
    }

    const raceResult = await prisma.raceResult.findUnique({
      where: { raceName },
    });

    if (!raceResult) {
      return NextResponse.json(
        { error: "Race result not found. Please submit results first." },
        { status: 404 }
      );
    }

    if (raceResult.scoringDone) {
      return NextResponse.json(
        { message: "Scoring already done for this race" },
        { status: 200 }
      );
    }

    // Find all predictions for this race
    const predictions = await prisma.prediction.findMany({
      where: { raceName },
    });

    let updatedCount = 0;

    for (const prediction of predictions) {
      const breakdown = calculateScore(prediction, raceResult);

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          points: breakdown.total,
          scoreBreakdown: JSON.stringify(breakdown),
          locked: true,
        },
      });

      updatedCount++;
    }

    // Mark scoring as done
    await prisma.raceResult.update({
      where: { raceName },
      data: { scoringDone: true },
    });

    return NextResponse.json({
      message: `Scoring complete. Updated ${updatedCount} predictions.`,
      updatedCount,
    });
  } catch (error) {
    console.error("Scoring error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Auto-scoring: check if any race has ended and hasn't been scored
export async function GET() {
  try {
    const now = Date.now();
    const results: string[] = [];

    const raceEntries = Object.entries(raceSchedule) as [
      string,
      RaceScheduleEntry
    ][];

    for (const [raceName, schedule] of raceEntries) {
      const raceEndTime = new Date(schedule.RaceEnd).getTime();
      if (now < raceEndTime) continue;

      const raceResult = await prisma.raceResult.findUnique({
        where: { raceName },
      });

      if (!raceResult || raceResult.scoringDone) continue;

      const predictions = await prisma.prediction.findMany({
        where: { raceName },
      });

      for (const prediction of predictions) {
        const breakdown = calculateScore(prediction, raceResult);
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            points: breakdown.total,
            scoreBreakdown: JSON.stringify(breakdown),
            locked: true,
          },
        });
      }

      await prisma.raceResult.update({
        where: { raceName },
        data: { scoringDone: true },
      });

      results.push(raceName);
    }

    return NextResponse.json({
      message: results.length
        ? `Auto-scored: ${results.join(", ")}`
        : "Nothing to score",
      scored: results,
    });
  } catch (error) {
    console.error("Auto-scoring error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
