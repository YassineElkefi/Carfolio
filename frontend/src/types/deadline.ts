
export type DeadlineType =
  | 'insurance'
  | 'technical_inspection'
  | 'road_tax'
  | 'maintenance';

export interface VehicleDeadline {
  id: string;
  vehicleId: string;
  type: DeadlineType;
  title: string;
  dueDate: string | null;
  dueMileage: number | null;
  completedAt: string | null;
  completedMileage: number | null;
  amountMillimes: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeadlineData {
  type: DeadlineType;
  title: string;
  dueDate?: string;
  dueMileage?: number;
  amountMillimes?: number;
  notes?: string;
}

export type UpdateDeadlineData = Partial<CreateDeadlineData>;

export interface CompleteDeadlineData {
  completedMileage?: number;
}
