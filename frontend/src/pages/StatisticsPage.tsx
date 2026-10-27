
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CarFront,
  Fuel,
  Gauge,
  Wrench,
} from 'lucide-react';
import { getVehicles } from '../lib/vehicles';
import { getVehicleStatistics } from '../lib/statistics';
import type { Vehicle } from '../types/vehicle';
import type { VehicleStatistics } from '../types/statistics';

function formatMoney(millimes: number) {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(millimes / 1000);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-TN').format(value);
}

function formatMonth(value: string) {
  const [year, month] = value.split('-').map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString('fr-TN', {
    month: 'short',
    year: '2-digit',
  });
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CarFront;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon size={19} className="text-cyan-400" />
      </div>

      <p className="mt-4 break-words text-2xl font-semibold text-slate-100">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

export default function StatisticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [statistics, setStatistics] = useState<VehicleStatistics | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      try {
        const result = await getVehicles();

        if (!cancelled) {
          setVehicles(result);
          setVehicleId(result[0]?.id ?? '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load vehicles.',
          );
        }
      } finally {
        if (!cancelled) setLoadingVehicles(false);
      }
    }

    void loadVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!vehicleId) {
      setStatistics(null);
      return;
    }

    let cancelled = false;

    async function loadStatistics() {
      setLoadingStats(true);
      setError('');
      setStatistics(null);

      try {
        const result = await getVehicleStatistics(vehicleId);

        if (!cancelled) setStatistics(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load vehicle statistics.',
          );
        }
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    }

    void loadStatistics();

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const maximumMonthlyCost = useMemo(
    () =>
      Math.max(
        1,
        ...(statistics?.monthlySpending.map(
          (month) => month.totalCostMillimes,
        ) ?? []),
      ),
    [statistics],
  );

  if (loadingVehicles) {
    return (
      <div className="p-8 text-slate-400">Loading vehicles...</div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-cyan-400">
            YOUR GARAGE
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-100">
            Vehicle statistics
          </h1>
          <p className="mt-2 text-slate-400">
            Understand your mileage, fuel spending, and maintenance costs.
          </p>
        </div>

        <select
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
          disabled={vehicles.length === 0}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
        >
          {vehicles.length === 0 && (
            <option value="">No vehicles available</option>
          )}

          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <CarFront className="mx-auto text-cyan-400" size={32} />
          <h2 className="mt-4 text-lg font-semibold text-slate-100">
            No vehicle yet
          </h2>
          <p className="mt-2 text-slate-400">
            Add a vehicle in your Garage to view its statistics.
          </p>
        </div>
      )}

      {loadingStats && (
        <p className="text-slate-400">Loading statistics...</p>
      )}

      {!loadingStats && statistics && (
        <>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  {statistics.vehicle.make} {statistics.vehicle.model}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {statistics.vehicle.year} · {statistics.vehicle.licensePlate}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-lg bg-cyan-400/10 px-3 py-2 text-sm text-cyan-300">
                <Gauge size={17} />
                {formatNumber(statistics.vehicle.currentMileage)} km
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total ownership costs"
              value={formatMoney(statistics.ownershipCosts.totalCostMillimes)}
              detail="Recorded fuel and maintenance"
              icon={Activity}
            />
            <StatCard
              label="Fuel spending"
              value={formatMoney(statistics.fuel.totalCostMillimes)}
              detail={`${formatNumber(statistics.fuel.recordsCount)} fuel records`}
              icon={Fuel}
            />
            <StatCard
              label="Maintenance spending"
              value={formatMoney(statistics.maintenance.totalCostMillimes)}
              detail={`${formatNumber(statistics.maintenance.recordsCount)} records`}
              icon={Wrench}
            />
            <StatCard
              label="Fuel purchased"
              value={`${formatNumber(statistics.fuel.totalLiters)} L`}
              detail="Total recorded liters"
              icon={Fuel}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold text-slate-100">
                Monthly spending
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Fuel and maintenance · Last six calendar months
              </p>

              <div className="mt-6 space-y-5">
                {statistics.monthlySpending.map((month) => (
                  <div key={month.month}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-300">
                        {formatMonth(month.month)}
                      </span>
                      <span className="font-medium text-slate-100">
                        {formatMoney(month.totalCostMillimes)}
                      </span>
                    </div>

                    <div className="flex h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-cyan-400"
                        style={{
                          width: `${
                            (month.fuelCostMillimes / maximumMonthlyCost) * 100
                          }%`,
                        }}
                        title={`Fuel: ${formatMoney(month.fuelCostMillimes)}`}
                      />
                      <div
                        className="h-full bg-violet-400"
                        style={{
                          width: `${
                            (month.maintenanceCostMillimes /
                              maximumMonthlyCost) *
                            100
                          }%`,
                        }}
                        title={`Maintenance: ${formatMoney(month.maintenanceCostMillimes)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
                  Fuel
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-violet-400" />
                  Maintenance
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold text-slate-100">
                Cost breakdown
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Recorded spending by category
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-300">Fuel</span>
                    <span className="text-slate-100">
                      {formatMoney(statistics.ownershipCosts.fuelCostMillimes)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-cyan-400"
                      style={{
                        width: `${
                          statistics.ownershipCosts.totalCostMillimes
                            ? (statistics.ownershipCosts.fuelCostMillimes /
                                statistics.ownershipCosts.totalCostMillimes) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-300">Parts</span>
                    <span className="text-slate-100">
                      {formatMoney(statistics.maintenance.partsCostMillimes)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-violet-400"
                      style={{
                        width: `${
                          statistics.ownershipCosts.totalCostMillimes
                            ? (statistics.maintenance.partsCostMillimes /
                                statistics.ownershipCosts.totalCostMillimes) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-300">Labor</span>
                    <span className="text-slate-100">
                      {formatMoney(statistics.maintenance.laborCostMillimes)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-amber-400"
                      style={{
                        width: `${
                          statistics.ownershipCosts.totalCostMillimes
                            ? (statistics.maintenance.laborCostMillimes /
                                statistics.ownershipCosts.totalCostMillimes) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-800 pt-5">
                <p className="text-sm text-slate-400">Total recorded costs</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-300">
                  {formatMoney(statistics.ownershipCosts.totalCostMillimes)}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Mileage records</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {formatNumber(statistics.mileage.recordsCount)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Parts costs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {formatMoney(statistics.maintenance.partsCostMillimes)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Labor costs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {formatMoney(statistics.maintenance.laborCostMillimes)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-100">
              Recent maintenance
            </h2>

            {statistics.maintenance.history.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">
                No maintenance records yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-800">
                {[...statistics.maintenance.history]
                  .reverse()
                  .slice(0, 5)
                  .map((record) => (
                    <div
                      key={record.id}
                      className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-medium text-slate-100">
                          {record.itemName}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {new Date(record.maintenanceDate).toLocaleDateString(
                            'fr-TN',
                          )}{' '}
                          · {formatNumber(record.mileage)} km
                        </p>
                      </div>

                      <p className="font-medium text-cyan-300">
                        {formatMoney(
                          record.partCostMillimes + record.laborCostMillimes,
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
