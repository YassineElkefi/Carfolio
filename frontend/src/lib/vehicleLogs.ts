import { apiRequest } from './api';
import type {
  CreateVehicleLogData,
  UpdateVehicleLogData,
  VehicleLog,
} from '../types/vehicleLog';

export function getVehicleLogs(vehicleId: string) {
  return apiRequest<VehicleLog[]>(`/vehicles/${vehicleId}/logs`);
}

export function createVehicleLog(vehicleId: string, data: CreateVehicleLogData) {
  return apiRequest<VehicleLog>(`/vehicles/${vehicleId}/logs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateVehicleLog(
  vehicleId: string,
  id: string,
  data: UpdateVehicleLogData,
) {
  return apiRequest<VehicleLog>(`/vehicles/${vehicleId}/logs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteVehicleLog(vehicleId: string, id: string) {
  return apiRequest<{ message: string }>(
    `/vehicles/${vehicleId}/logs/${id}`,
    { method: 'DELETE' },
  );
}
