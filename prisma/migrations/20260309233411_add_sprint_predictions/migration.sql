-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN "sprintPodium1" TEXT;
ALTER TABLE "Prediction" ADD COLUMN "sprintPodium2" TEXT;
ALTER TABLE "Prediction" ADD COLUMN "sprintPodium3" TEXT;
ALTER TABLE "Prediction" ADD COLUMN "sprintPole" TEXT;

-- AlterTable
ALTER TABLE "RaceResult" ADD COLUMN "sprintPodium1" TEXT;
ALTER TABLE "RaceResult" ADD COLUMN "sprintPodium2" TEXT;
ALTER TABLE "RaceResult" ADD COLUMN "sprintPodium3" TEXT;
ALTER TABLE "RaceResult" ADD COLUMN "sprintPole" TEXT;
