export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  liters: number;
  totalCostMillimes: number;
  fuelType: string | null;
  note: string | null;
}

export interface CreateFuelLogData {
  date?: string;
  mileage: number;
  liters: number;
  totalCostMillimes: number;
  fuelType?: string;
  note?: string;
}
