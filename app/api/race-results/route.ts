import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raceName = url.searchParams.get("raceName");

  try {
    if (raceName) {
      const result = await prisma.raceResult.findUnique({
        where: { raceName },
      });
      return NextResponse.json(result || null);
    }

    const results = await prisma.raceResult.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(results);
  } catch (error) {
    console.error("GET race-results error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // In production this would be admin-only; for now any authenticated user can submit
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      raceName,
      driver1,
      driver2,
      driver3,
      driver4,
      driver5,
      pole,
      team1,
      team2,
      team3,
      fastestLap,
    } = body;

    if (!raceName) {
      return NextResponse.json(
        { error: "Race name required" },
        { status: 400 }
      );
    }

    const result = await prisma.raceResult.upsert({
      where: { raceName },
      update: {
        driver1,
        driver2,
        driver3,
        driver4,
        driver5,
        pole,
        team1,
        team2,
        team3,
        fastestLap,
        scoringDone: false,
      },
      create: {
        raceName,
        driver1,
        driver2,
        driver3,
        driver4,
        driver5,
        pole,
        team1,
        team2,
        team3,
        fastestLap,
      },
    });

    return NextResponse.json({ message: "Race result saved", result });
  } catch (error) {
    console.error("POST race-results error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
