import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await auth();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  // If fetching someone else's profile
  const targetId = userId || session?.user?.id;
  if (!targetId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        predictions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf = session?.user?.id === targetId;

    // Calculate stats
    const completedPredictions = user.predictions.filter(
      (p) => p.points !== null
    );
    const totalPoints = completedPredictions.reduce(
      (sum, p) => sum + (p.points ?? 0),
      0
    );

    // Calculate leaderboard position
    const allUsers = await prisma.user.findMany({
      include: { predictions: { where: { points: { not: null } } } },
    });

    const userPoints = allUsers.map((u) => ({
      id: u.id,
      points: u.predictions.reduce((s, p) => s + (p.points ?? 0), 0),
    }));

    userPoints.sort((a, b) => b.points - a.points);
    const position = userPoints.findIndex((u) => u.id === targetId) + 1;

    // Calculate % correct
    let correctCount = 0;
    let totalPredictions = 0;
    for (const p of completedPredictions) {
      if (p.scoreBreakdown) {
        try {
          const breakdown = JSON.parse(p.scoreBreakdown);
          correctCount += breakdown.exactCount || 0;
          totalPredictions += breakdown.totalPredictions || 0;
        } catch {}
      }
    }
    const percentCorrect =
      totalPredictions > 0
        ? Math.round((correctCount / totalPredictions) * 100)
        : 0;

    const responseData: Record<string, unknown> = {
      id: user.id,
      name: user.name,
      email: isSelf ? user.email : undefined,
      favoriteTeam: user.favoriteTeam,
      favoriteDriver: user.favoriteDriver,
      totalPoints,
      leaderboardPosition: position,
      percentCorrect,
      predictions: user.predictions,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, favoriteTeam, favoriteDriver, currentPassword, newPassword } =
      body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (favoriteTeam !== undefined) updateData.favoriteTeam = favoriteTeam;
    if (favoriteDriver !== undefined) updateData.favoriteDriver = favoriteDriver;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password required" },
          { status: 400 }
        );
      }
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Profile updated",
      name: updated.name,
      favoriteTeam: updated.favoriteTeam,
      favoriteDriver: updated.favoriteDriver,
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
