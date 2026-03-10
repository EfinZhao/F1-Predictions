export type ScoreBreakdown = {
  driver1Points: number;
  driver2Points: number;
  driver3Points: number;
  driver4Points: number;
  driver5Points: number;
  polePoints: number;
  team1Points: number;
  team2Points: number;
  team3Points: number;
  fastestLapPoints: number;
  sprintPolePoints: number;
  sprintPodium1Points: number;
  sprintPodium2Points: number;
  sprintPodium3Points: number;
  total: number;
  exactCount: number;
  totalPredictions: number;
};

export function calculateScore(
  prediction: {
    driver1?: string | null;
    driver2?: string | null;
    driver3?: string | null;
    driver4?: string | null;
    driver5?: string | null;
    pole?: string | null;
    team1?: string | null;
    team2?: string | null;
    team3?: string | null;
    fastestLap?: string | null;
    sprintPole?: string | null;
    sprintPodium1?: string | null;
    sprintPodium2?: string | null;
    sprintPodium3?: string | null;
  },
  result: {
    driver1?: string | null;
    driver2?: string | null;
    driver3?: string | null;
    driver4?: string | null;
    driver5?: string | null;
    pole?: string | null;
    team1?: string | null;
    team2?: string | null;
    team3?: string | null;
    fastestLap?: string | null;
    sprintPole?: string | null;
    sprintPodium1?: string | null;
    sprintPodium2?: string | null;
    sprintPodium3?: string | null;
  }
): ScoreBreakdown {
  const predDrivers = [
    prediction.driver1,
    prediction.driver2,
    prediction.driver3,
    prediction.driver4,
    prediction.driver5,
  ];
  const actDrivers = [
    result.driver1,
    result.driver2,
    result.driver3,
    result.driver4,
    result.driver5,
  ];

  // Score top 5 drivers
  const driverPoints: number[] = [];
  let exactCount = 0;
  let totalPredictions = 0;

  for (let i = 0; i < 5; i++) {
    const pred = predDrivers[i];
    const actual = actDrivers[i];

    if (!pred || !actual) {
      driverPoints.push(0);
      continue;
    }

    totalPredictions++;

    if (pred === actual) {
      // Exact position match
      driverPoints.push(2);
      exactCount++;
    } else {
      // Check if predicted driver is within +1/-1 of actual position
      const actualPosOfPredicted = actDrivers.indexOf(pred);
      if (
        actualPosOfPredicted !== -1 &&
        Math.abs(actualPosOfPredicted - i) <= 1
      ) {
        driverPoints.push(1);
      } else {
        driverPoints.push(0);
      }
    }
  }

  // Pole position - 2 points for exact
  let polePoints = 0;
  if (prediction.pole && result.pole) {
    totalPredictions++;
    if (prediction.pole === result.pole) {
      polePoints = 2;
      exactCount++;
    }
  }

  // Top 3 teams - 1 point per exact position
  const predTeams = [prediction.team1, prediction.team2, prediction.team3];
  const actTeams = [result.team1, result.team2, result.team3];
  const teamPoints: number[] = [];

  for (let i = 0; i < 3; i++) {
    const pred = predTeams[i];
    const actual = actTeams[i];

    if (!pred || !actual) {
      teamPoints.push(0);
      continue;
    }

    totalPredictions++;
    if (pred === actual) {
      teamPoints.push(1);
      exactCount++;
    } else {
      teamPoints.push(0);
    }
  }

  // Fastest lap - 1 point for exact
  let fastestLapPoints = 0;
  if (prediction.fastestLap && result.fastestLap) {
    totalPredictions++;
    if (prediction.fastestLap === result.fastestLap) {
      fastestLapPoints = 1;
      exactCount++;
    }
  }

  // Sprint pole - 1 point for exact
  let sprintPolePoints = 0;
  if (prediction.sprintPole && result.sprintPole) {
    totalPredictions++;
    if (prediction.sprintPole === result.sprintPole) {
      sprintPolePoints = 1;
      exactCount++;
    }
  }

  // Sprint podium - 1 point per exact position
  const predSprintPodium = [prediction.sprintPodium1, prediction.sprintPodium2, prediction.sprintPodium3];
  const actSprintPodium = [result.sprintPodium1, result.sprintPodium2, result.sprintPodium3];
  const sprintPodiumPoints: number[] = [];

  for (let i = 0; i < 3; i++) {
    const pred = predSprintPodium[i];
    const actual = actSprintPodium[i];

    if (!pred || !actual) {
      sprintPodiumPoints.push(0);
      continue;
    }

    totalPredictions++;
    if (pred === actual) {
      sprintPodiumPoints.push(1);
      exactCount++;
    } else {
      sprintPodiumPoints.push(0);
    }
  }

  const total =
    driverPoints.reduce((s, p) => s + p, 0) +
    polePoints +
    teamPoints.reduce((s, p) => s + p, 0) +
    fastestLapPoints +
    sprintPolePoints +
    sprintPodiumPoints.reduce((s, p) => s + p, 0);

  return {
    driver1Points: driverPoints[0],
    driver2Points: driverPoints[1],
    driver3Points: driverPoints[2],
    driver4Points: driverPoints[3],
    driver5Points: driverPoints[4],
    polePoints,
    team1Points: teamPoints[0],
    team2Points: teamPoints[1],
    team3Points: teamPoints[2],
    fastestLapPoints,
    sprintPolePoints,
    sprintPodium1Points: sprintPodiumPoints[0],
    sprintPodium2Points: sprintPodiumPoints[1],
    sprintPodium3Points: sprintPodiumPoints[2],
    total,
    exactCount,
    totalPredictions,
  };
}
