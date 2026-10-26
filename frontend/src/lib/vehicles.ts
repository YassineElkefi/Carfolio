
import { apiRequest } from './api';
import type { CreateVehicleData, Vehicle } from '../types/vehicle';



export function getVehicles() {
  return apiRequest<Vehicle[]>('/vehicles');
}

export function createVehicle(data: CreateVehicleData) {
  return apiRequest<Vehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


export function updateVehicle(
  id: string,
  data: Partial<CreateVehicleData>,
) {
  return apiRequest<Vehicle>(`/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteVehicle(id: string) {
  return apiRequest<Vehicle>(`/vehicles/${id}`, {
    method: 'DELETE',
  });
}

