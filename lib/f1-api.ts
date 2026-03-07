import raceSchedule from "@/2026_race_schedule.json";

// Map app race names → Jolpica API round numbers (1-indexed, order matches schedule)
export const RACE_ROUND_MAP: Record<string, number> = Object.fromEntries(
  Object.keys(raceSchedule).map((name, idx) => [name, idx + 1])
);

// Map API driver full names → app driver names (for known mismatches)
const DRIVER_NAME_MAP: Record<string, string> = {
  "Andrea Kimi Antonelli": "Kimi Antonelli",
  "Gabriel Bortoleto": "Gabriel Bortoleto",
  "Jack Doohan": "Jack Doohan",
};

function mapDriver(fullName: string): string {
  return DRIVER_NAME_MAP[fullName] ?? fullName;
}

// Map Jolpica constructor names → app team names
const CONSTRUCTOR_NAME_MAP: Record<string, string> = {
  "Red Bull": "Red Bull Racing",
  "Haas F1 Team": "Haas",
  "Alpine F1 Team": "Alpine",
  "RB F1 Team": "Racing Bulls",
  McLaren: "McLaren",
  Mercedes: "Mercedes",
  Ferrari: "Ferrari",
  "Aston Martin": "Aston Martin",
  Williams: "Williams",
  Sauber: "Sauber",
};

function mapTeam(apiName: string): string {
  return CONSTRUCTOR_NAME_MAP[apiName] ?? apiName;
}

function driverFullName(driver: { givenName: string; familyName: string }) {
  return `${driver.givenName} ${driver.familyName}`;
}

export type FetchedRaceResult = {
  driver1: string;
  driver2: string;
  driver3: string;
  driver4: string;
  driver5: string;
  pole: string | null;
  team1: string | null;
  team2: string | null;
  team3: string | null;
  fastestLap: string | null;
};

type JolpicaDriver = {
  givenName: string;
  familyName: string;
};

type JolpicaResult = {
  position: string;
  points: string;
  Driver: JolpicaDriver;
  Constructor: { name: string };
  FastestLap?: { rank: string };
};

type JolpicaQualResult = {
  position: string;
  Driver: JolpicaDriver;
};

/**
 * Fetch race result for a given year and round from the Jolpica API.
 * Returns null if the race has not yet been run or data is unavailable.
 */
export async function fetchRaceResult(
  year: number,
  round: number
): Promise<FetchedRaceResult | null> {
  try {
    const url = `https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json();
    const races = json?.MRData?.RaceTable?.Races;
    if (!Array.isArray(races) || races.length === 0) return null;

    const results: JolpicaResult[] = races[0].Results ?? [];
    if (results.length < 5) return null;

    // Sort by finishing position to be safe
    results.sort((a, b) => parseInt(a.position) - parseInt(b.position));

    const fastestLapResult = results.find((r) => r.FastestLap?.rank === "1");

    // Fetch pole position from qualifying endpoint
    const pole = await fetchPolePosition(year, round);

    // Tally points per constructor across ALL drivers, then rank.
    // Tiebreaker: whichever team has the higher best-finishing driver (lower position number).
    const teamPoints: Record<string, number> = {};
    const teamBestPos: Record<string, number> = {};
    for (const r of results) {
      const team = mapTeam(r.Constructor.name);
      const pos = parseInt(r.position);
      teamPoints[team] = (teamPoints[team] ?? 0) + parseFloat(r.points || "0");
      if (teamBestPos[team] === undefined || pos < teamBestPos[team]) {
        teamBestPos[team] = pos;
      }
    }
    const rankedTeams = Object.keys(teamPoints).sort((a, b) => {
      const ptsDiff = teamPoints[b] - teamPoints[a];
      if (ptsDiff !== 0) return ptsDiff;
      return teamBestPos[a] - teamBestPos[b]; // lower position = better
    });

    return {
      driver1: mapDriver(driverFullName(results[0].Driver)),
      driver2: mapDriver(driverFullName(results[1].Driver)),
      driver3: mapDriver(driverFullName(results[2].Driver)),
      driver4: mapDriver(driverFullName(results[3].Driver)),
      driver5: mapDriver(driverFullName(results[4].Driver)),
      pole,
      team1: rankedTeams[0] ?? null,
      team2: rankedTeams[1] ?? null,
      team3: rankedTeams[2] ?? null,
      fastestLap: fastestLapResult
        ? mapDriver(driverFullName(fastestLapResult.Driver))
        : null,
    };
  } catch (err) {
    console.error(
      `[f1-api] fetchRaceResult error (year=${year} round=${round}):`,
      err
    );
    return null;
  }
}

/**
 * Fetch pole position driver for a given year and round.
 * Returns null if qualifying data is not yet available.
 */
export async function fetchPolePosition(
  year: number,
  round: number
): Promise<string | null> {
  try {
    const url = `https://api.jolpi.ca/ergast/f1/${year}/${round}/qualifying.json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json();
    const races = json?.MRData?.RaceTable?.Races;
    if (!Array.isArray(races) || races.length === 0) return null;

    const qualResults: JolpicaQualResult[] = races[0].QualifyingResults ?? [];
    if (qualResults.length === 0) return null;

    const pole = qualResults.find((r) => r.position === "1");
    return pole ? mapDriver(driverFullName(pole.Driver)) : null;
  } catch (err) {
    console.error(
      `[f1-api] fetchPolePosition error (year=${year} round=${round}):`,
      err
    );
    return null;
  }
}
