-- CreateTable
CREATE TABLE "MileageRecord" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "mileage" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "MileageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MileageRecord_vehicleId_recordedAt_idx" ON "MileageRecord"("vehicleId", "recordedAt" DESC);

-- AddForeignKey
ALTER TABLE "MileageRecord" ADD CONSTRAINT "MileageRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
