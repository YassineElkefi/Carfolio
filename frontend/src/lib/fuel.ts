import { apiRequest } from './api';
import type { FuelLog, CreateFuelLogData } from '../types/fuel';

export function getFuelLogs(vehicleId: string) {
  return apiRequest<FuelLog[]>(`/vehicles/${vehicleId}/fuel`);
}

export function createFuelLog(
  vehicleId: string,
  data: CreateFuelLogData,
) {
  return apiRequest<FuelLog>(`/vehicles/${vehicleId}/fuel`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
