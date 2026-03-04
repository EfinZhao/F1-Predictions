import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import raceSchedule from "@/2026_race_schedule.json";

type RaceScheduleEntry = {
  "practice 1": string;
  "practice 2": string;
  "practice 3": string;
  Qualifying: string;
  Race: string;
  RaceEnd: string;
};

function getCurrentRace(): { name: string; schedule: RaceScheduleEntry } | null {
  const now = Date.now();
  const entries = Object.entries(raceSchedule) as [
    string,
    RaceScheduleEntry
  ][];

  // Find the next race whose practice 1 hasn't started yet, or the current active race weekend
  for (const [name, schedule] of entries) {
    const p1Time = new Date(schedule["practice 1"]).getTime();
    const raceEndTime = new Date(schedule.RaceEnd).getTime();

    // Race weekend is "current" from practice 1 to race end
    if (now >= p1Time && now <= raceEndTime) {
      return { name, schedule };
    }

    // Or it's the upcoming race if practice 1 hasn't started yet
    if (now < p1Time) {
      return { name, schedule };
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const raceName = url.searchParams.get("raceName");

  try {
    if (raceName) {
      const prediction = await prisma.prediction.findUnique({
        where: {
          userId_raceName: {
            userId: session.user.id,
            raceName,
          },
        },
      });
      return NextResponse.json(prediction || null);
    }

    const currentRace = getCurrentRace();
    if (!currentRace) {
      return NextResponse.json({ error: "No upcoming races" }, { status: 404 });
    }

    const prediction = await prisma.prediction.findUnique({
      where: {
        userId_raceName: {
          userId: session.user.id,
          raceName: currentRace.name,
        },
      },
    });

    return NextResponse.json({
      raceName: currentRace.name,
      schedule: currentRace.schedule,
      prediction: prediction || null,
      isLocked: Date.now() >= new Date(currentRace.schedule["practice 1"]).getTime(),
    });
  } catch (error) {
    console.error("GET predictions error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { raceName, driver1, driver2, driver3, driver4, driver5, pole, team1, team2, team3, fastestLap } = body;

    if (!raceName) {
      return NextResponse.json({ error: "Race name required" }, { status: 400 });
    }

    // Check if locked
    const schedule = (raceSchedule as Record<string, RaceScheduleEntry>)[raceName];
    if (!schedule) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    const isLocked = Date.now() >= new Date(schedule["practice 1"]).getTime();
    if (isLocked) {
      return NextResponse.json(
        { error: "Predictions are locked for this race" },
        { status: 403 }
      );
    }

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_raceName: {
          userId: session.user.id,
          raceName,
        },
      },
      update: {
        driver1: driver1 || null,
        driver2: driver2 || null,
        driver3: driver3 || null,
        driver4: driver4 || null,
        driver5: driver5 || null,
        pole: pole || null,
        team1: team1 || null,
        team2: team2 || null,
        team3: team3 || null,
        fastestLap: fastestLap || null,
      },
      create: {
        userId: session.user.id,
        raceName,
        driver1: driver1 || null,
        driver2: driver2 || null,
        driver3: driver3 || null,
        driver4: driver4 || null,
        driver5: driver5 || null,
        pole: pole || null,
        team1: team1 || null,
        team2: team2 || null,
        team3: team3 || null,
        fastestLap: fastestLap || null,
      },
    });

    return NextResponse.json({ message: "Prediction saved", prediction });
  } catch (error) {
    console.error("POST predictions error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
