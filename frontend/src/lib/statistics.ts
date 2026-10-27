import { apiRequest } from './api';
import type { VehicleStatistics } from '../types/statistics';

export function getVehicleStatistics(vehicleId: string) {
  return apiRequest<VehicleStatistics>(
    `/vehicles/${vehicleId}/statistics`,
  );
}
