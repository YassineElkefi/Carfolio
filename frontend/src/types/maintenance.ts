export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  itemName: string;
  category: string | null;
  purchaseDate: string | null;
  maintenanceDate: string;
  mileage: number;
  partCostMillimes: number;
  laborCostMillimes: number;
  mechanicName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceData {
  itemName: string;
  category?: string;
  purchaseDate?: string;
  maintenanceDate?: string;
  mileage: number;
  partCostMillimes?: number;
  laborCostMillimes?: number;
  mechanicName?: string;
  notes?: string;
}

export type UpdateMaintenanceData = Partial<CreateMaintenanceData>;