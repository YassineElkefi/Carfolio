export interface RepairRecommendation {
  id: string;
  vehicleId: string;
  partName: string;
  mechanicName: string;
  recommendedAt: string;
  isBought: boolean;
  isMounted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRepairRecommendationData {
  partName: string;
  mechanicName: string;
  recommendedAt?: string;
  isBought?: boolean;
  isMounted?: boolean;
}

export type UpdateRepairRecommendationData =
  Partial<CreateRepairRecommendationData>;
