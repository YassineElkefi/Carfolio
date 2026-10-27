-- CreateTable
CREATE TABLE "RepairRecommendation" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "partName" TEXT NOT NULL,
    "mechanicName" TEXT NOT NULL,
    "recommendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBought" BOOLEAN NOT NULL DEFAULT false,
    "isMounted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepairRecommendation_vehicleId_recommendedAt_idx" ON "RepairRecommendation"("vehicleId", "recommendedAt" DESC);

-- AddForeignKey
ALTER TABLE "RepairRecommendation" ADD CONSTRAINT "RepairRecommendation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
