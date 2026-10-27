export type VehicleLogType =
  | 'technical_inspection'
  | 'oil_filter_change'
  | 'road_tax';

export interface VehicleLog {
  id: string;
  vehicleId: string;
  type: VehicleLogType;
  date: string;
  mileage: number | null;
  amountMillimes: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleLogData {
  type: VehicleLogType;
  date: string;
  mileage?: number;
  amountMillimes: number;
  notes?: string;
}

export type UpdateVehicleLogData = Partial<CreateVehicleLogData>;
