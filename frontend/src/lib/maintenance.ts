import { apiRequest } from './api';
import type {
  MaintenanceRecord,
  CreateMaintenanceData,
  UpdateMaintenanceData,
} from '../types/maintenance';

export function getMaintenanceRecords(vehicleId: string) {
  return apiRequest<MaintenanceRecord[]>(
    `/vehicles/${vehicleId}/maintenance`,
  );
}

export function createMaintenanceRecord(
  vehicleId: string,
  data: CreateMaintenanceData,
) {
  return apiRequest<MaintenanceRecord>(
    `/vehicles/${vehicleId}/maintenance`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export function updateMaintenanceRecord(
  vehicleId: string,
  id: string,
  data: UpdateMaintenanceData,
) {
  return apiRequest<MaintenanceRecord>(
    `/vehicles/${vehicleId}/maintenance/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export function deleteMaintenanceRecord(vehicleId: string, id: string) {
  return apiRequest<{ message: string }>(
    `/vehicles/${vehicleId}/maintenance/${id}`,
    { method: 'DELETE' },
  );
}