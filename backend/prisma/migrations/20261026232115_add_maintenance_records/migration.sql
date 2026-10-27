-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "maintenanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mileage" INTEGER NOT NULL,
    "partCostMillimes" INTEGER NOT NULL DEFAULT 0,
    "laborCostMillimes" INTEGER NOT NULL DEFAULT 0,
    "mechanicName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_maintenanceDate_idx" ON "MaintenanceRecord"("vehicleId", "maintenanceDate" DESC);

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
