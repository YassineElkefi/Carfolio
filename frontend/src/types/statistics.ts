
export interface VehicleStatistics {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    currentMileage: number;
  };

  mileage: {
    current: number;
    recordsCount: number;
    history: {
      id: string;
      mileage: number;
      recordedAt: string;
      note: string | null;
    }[];
  };

  fuel: {
    recordsCount: number;
    totalLiters: number;
    totalCostMillimes: number;
    history: {
      id: string;
      date: string;
      mileage: number;
      liters: number;
      totalCostMillimes: number;
      fuelType: string | null;
    }[];
  };

  maintenance: {
    recordsCount: number;
    partsCostMillimes: number;
    laborCostMillimes: number;
    totalCostMillimes: number;
    history: {
      id: string;
      itemName: string;
      category: string | null;
      maintenanceDate: string;
      mileage: number;
      partCostMillimes: number;
      laborCostMillimes: number;
    }[];
  };

  ownershipCosts: {
    fuelCostMillimes: number;
    maintenanceCostMillimes: number;
    totalCostMillimes: number;
  };

  monthlySpending: {
    month: string;
    fuelCostMillimes: number;
    maintenanceCostMillimes: number;
    totalCostMillimes: number;
  }[];
}
