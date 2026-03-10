import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/lib/scoring";
import { fetchRaceResult, RACE_ROUND_MAP } from "@/lib/f1-api";
import raceSchedule from "@/2026_race_schedule.json";

type RaceScheduleEntry = {
  "practice 1": string;
  RaceEnd: string;
};

export type AutoScoreResult = {
  scored: string[];
  skipped: string[];
  errors: string[];
};

/**
 * Check all races that have ended and haven't been scored yet.
 * For each, fetch results from the Jolpica API and run scoring.
 */
export async function runAutoScore(force = false): Promise<AutoScoreResult> {
  const now = Date.now();
  const year = new Date().getFullYear();
  const result: AutoScoreResult = { scored: [], skipped: [], errors: [] };

  const raceEntries = Object.entries(raceSchedule) as [
    string,
    RaceScheduleEntry
  ][];

  for (const [raceName, schedule] of raceEntries) {
    const raceEndTime = new Date(schedule.RaceEnd).getTime();

    // Skip races that haven't ended yet
    if (now < raceEndTime) {
      result.skipped.push(`${raceName} (not ended yet)`);
      continue;
    }

    // Check if already scored
    const existingResult = await prisma.raceResult.findUnique({
      where: { raceName },
    });

    if (existingResult?.scoringDone && !force) {
      result.skipped.push(`${raceName} (already scored)`);
      continue;
    }

    // Get the round number for this race
    const round = RACE_ROUND_MAP[raceName];
    if (!round) {
      result.errors.push(`${raceName}: no round mapping found`);
      continue;
    }

    console.log(
      `[auto-score] Fetching results for ${raceName} (round ${round}, year ${year})`
    );

    // Fetch from Jolpica API
    const raceData = await fetchRaceResult(year, round);

    if (!raceData) {
      result.skipped.push(`${raceName} (API results not yet available)`);
      continue;
    }

    try {
      // Upsert the race result into the DB
      await prisma.raceResult.upsert({
        where: { raceName },
        update: {
          driver1: raceData.driver1,
          driver2: raceData.driver2,
          driver3: raceData.driver3,
          driver4: raceData.driver4,
          driver5: raceData.driver5,
          pole: raceData.pole,
          team1: raceData.team1,
          team2: raceData.team2,
          team3: raceData.team3,
          fastestLap: raceData.fastestLap,
          scoringDone: false,
        },
        create: {
          raceName,
          driver1: raceData.driver1,
          driver2: raceData.driver2,
          driver3: raceData.driver3,
          driver4: raceData.driver4,
          driver5: raceData.driver5,
          pole: raceData.pole,
          team1: raceData.team1,
          team2: raceData.team2,
          team3: raceData.team3,
          fastestLap: raceData.fastestLap,
        },
      });

      // Score all predictions for this race
      const predictions = await prisma.prediction.findMany({
        where: { raceName },
      });

      for (const prediction of predictions) {
        const breakdown = calculateScore(prediction, raceData);
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            points: breakdown.total,
            scoreBreakdown: JSON.stringify(breakdown),
            locked: true,
          },
        });
      }

      // Mark race as scored
      await prisma.raceResult.update({
        where: { raceName },
        data: { scoringDone: true },
      });

      console.log(
        `[auto-score] Scored ${raceName}: ${predictions.length} predictions updated`
      );
      result.scored.push(raceName);
    } catch (err) {
      console.error(`[auto-score] Error scoring ${raceName}:`, err);
      result.errors.push(
        `${raceName}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}
