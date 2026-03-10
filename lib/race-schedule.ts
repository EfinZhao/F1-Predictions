import raceSchedule from "@/2026_race_schedule.json";

export type RaceSession = {
  "practice 1": string;
  "practice 2"?: string;
  "practice 3"?: string;
  "Sprint Qualifying"?: string;
  Sprint?: string;
  SprintEnd?: string;
  Qualifying: string;
  Race: string;
  RaceEnd: string;
  hasSprint?: boolean;
};

export type RaceEntry = {
  name: string;
  schedule: RaceSession;
};

export const allRaces: RaceEntry[] = Object.entries(raceSchedule).map(
  ([name, schedule]) => ({
    name,
    schedule: schedule as RaceSession,
  })
);

export function getNextSession(): {
  raceName: string;
  sessionName: string;
  sessionTime: string;
} | null {
  const now = Date.now();

  for (const race of allRaces) {
    const sessions: [string, string][] = [
      ["practice 1", race.schedule["practice 1"]],
      ...(race.schedule["Sprint Qualifying"] ? [["Sprint Qualifying", race.schedule["Sprint Qualifying"]] as [string, string]] : []),
      ...(race.schedule.Sprint ? [["Sprint", race.schedule.Sprint] as [string, string]] : []),
      ...(race.schedule["practice 2"] ? [["practice 2", race.schedule["practice 2"]] as [string, string]] : []),
      ...(race.schedule["practice 3"] ? [["practice 3", race.schedule["practice 3"]] as [string, string]] : []),
      ["Qualifying", race.schedule.Qualifying],
      ["Race", race.schedule.Race],
    ];

    for (const [sessionName, sessionTime] of sessions) {
      if (new Date(sessionTime).getTime() > now) {
        return {
          raceName: race.name,
          sessionName,
          sessionTime,
        };
      }
    }
  }

  return null;
}

export function getCurrentOrUpcomingRace(): RaceEntry | null {
  const now = Date.now();

  for (const race of allRaces) {
    const p1Time = new Date(race.schedule["practice 1"]).getTime();
    const raceEndTime = new Date(race.schedule.RaceEnd).getTime();

    // Active race weekend
    if (now >= p1Time && now <= raceEndTime) {
      return race;
    }

    // Upcoming race
    if (now < p1Time) {
      return race;
    }
  }

  return null;
}

export function isRaceLocked(raceName: string): boolean {
  const race = allRaces.find((r) => r.name === raceName);
  if (!race) return true;
  return Date.now() >= new Date(race.schedule["practice 1"]).getTime();
}
