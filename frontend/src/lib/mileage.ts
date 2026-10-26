import { apiRequest } from './api';
import type {
  MileageRecord,
  CreateMileageData,
} from '../types/mileage';

export function getMileageHistory(vehicleId: string) {
  return apiRequest<MileageRecord[]>(
    `/vehicles/${vehicleId}/mileage`,
  );
}

export function createMileageRecord(
  vehicleId: string,
  data: CreateMileageData,
) {
  return apiRequest<MileageRecord>(
    `/vehicles/${vehicleId}/mileage`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}
