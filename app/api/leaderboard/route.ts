import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        favoriteTeam: true,
        favoriteDriver: true,
        predictions: {
          select: {
            points: true,
          },
          where: {
            points: { not: null },
          },
        },
      },
    });

    const leaderboard = users.map((user) => ({
      id: user.id,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      favoriteTeam: user.favoriteTeam,
      favoriteDriver: user.favoriteDriver,
      totalPoints: user.predictions.reduce((s, p) => s + (p.points ?? 0), 0),
    }));

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
