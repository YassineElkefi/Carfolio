export interface MileageRecord {
  id: string;
  vehicleId: string;
  mileage: number;
  recordedAt: string;
  note: string | null;
}

export interface CreateMileageData {
  mileage: number;
  note?: string;
}
