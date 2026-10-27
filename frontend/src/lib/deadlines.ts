
import { apiRequest } from './api';
import type {
  VehicleDeadline,
  CreateDeadlineData,
  UpdateDeadlineData,
  CompleteDeadlineData,
} from '../types/deadline';

export function getDeadlines(vehicleId: string) {
  return apiRequest<VehicleDeadline[]>(
    `/vehicles/${vehicleId}/deadlines`,
  );
}

export function createDeadline(
  vehicleId: string,
  data: CreateDeadlineData,
) {
  return apiRequest<VehicleDeadline>(
    `/vehicles/${vehicleId}/deadlines`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export function updateDeadline(
  vehicleId: string,
  deadlineId: string,
  data: UpdateDeadlineData,
) {
  return apiRequest<VehicleDeadline>(
    `/vehicles/${vehicleId}/deadlines/${deadlineId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export function completeDeadline(
  vehicleId: string,
  deadlineId: string,
  data: CompleteDeadlineData = {},
) {
  return apiRequest<VehicleDeadline>(
    `/vehicles/${vehicleId}/deadlines/${deadlineId}/complete`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export function deleteDeadline(
  vehicleId: string,
  deadlineId: string,
) {
  return apiRequest<{ message: string }>(
    `/vehicles/${vehicleId}/deadlines/${deadlineId}`,
    {
      method: 'DELETE',
    },
  );
}
