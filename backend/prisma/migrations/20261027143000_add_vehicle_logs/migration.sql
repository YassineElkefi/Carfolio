-- CreateTable
CREATE TABLE "VehicleLog" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mileage" INTEGER,
    "amountMillimes" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleLog_vehicleId_type_date_idx" ON "VehicleLog"("vehicleId", "type", "date" DESC);

-- AddForeignKey
ALTER TABLE "VehicleLog" ADD CONSTRAINT "VehicleLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
