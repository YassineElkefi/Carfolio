import { apiRequest } from './api';
import type {
  CreateRepairRecommendationData,
  RepairRecommendation,
  UpdateRepairRecommendationData,
} from '../types/repair-recommendation';

export function getRepairRecommendations(vehicleId: string) {
  return apiRequest<RepairRecommendation[]>(
    `/vehicles/${vehicleId}/repair-recommendations`,
  );
}

export function createRepairRecommendation(
  vehicleId: string,
  data: CreateRepairRecommendationData,
) {
  return apiRequest<RepairRecommendation>(
    `/vehicles/${vehicleId}/repair-recommendations`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export function updateRepairRecommendation(
  vehicleId: string,
  id: string,
  data: UpdateRepairRecommendationData,
) {
  return apiRequest<RepairRecommendation>(
    `/vehicles/${vehicleId}/repair-recommendations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export function deleteRepairRecommendation(vehicleId: string, id: string) {
  return apiRequest<{ message: string }>(
    `/vehicles/${vehicleId}/repair-recommendations/${id}`,
    { method: 'DELETE' },
  );
}
