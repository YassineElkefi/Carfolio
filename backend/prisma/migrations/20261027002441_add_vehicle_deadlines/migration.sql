-- CreateTable
CREATE TABLE "VehicleDeadline" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "dueMileage" INTEGER,
    "completedAt" TIMESTAMP(3),
    "completedMileage" INTEGER,
    "amountMillimes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleDeadline_vehicleId_dueDate_idx" ON "VehicleDeadline"("vehicleId", "dueDate");

-- CreateIndex
CREATE INDEX "VehicleDeadline_vehicleId_type_idx" ON "VehicleDeadline"("vehicleId", "type");

-- AddForeignKey
ALTER TABLE "VehicleDeadline" ADD CONSTRAINT "VehicleDeadline_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
