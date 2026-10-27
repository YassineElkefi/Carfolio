import { useEffect, useMemo, useState } from 'react';
import { Activity, CarFront, Fuel, Gauge, Wrench, TrendingUp, LoaderCircle, Car, AlertCircle } from 'lucide-react';

import { getVehicles } from '../lib/vehicles';
import { getVehicleStatistics } from '../lib/statistics';
import type { Vehicle } from '../types/vehicle';
import type { VehicleStatistics } from '../types/statistics';
import { TunisianPlate } from '../lib/tunisianPlate';
import { FieldSelect } from '../components/FormFields';

function formatMoney(millimes: number) {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(millimes / 1000);
}

function formatNum(n: number) {
  return new Intl.NumberFormat('fr-TN').format(n);
}

function formatMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function StatCard({ label, value, sub, icon: Icon, accent = false }: { label: string; value: string; sub: string; icon: typeof CarFront; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: accent ? 'var(--accent-light)' : 'var(--bg-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={15} style={{ color: accent ? 'var(--accent)' : 'var(--text-secondary)' }} />
        </div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', fontVariantNumeric: 'tabular-nums', color: accent ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{sub}</div>
    </div>
  );
}

export default function StatisticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [stats, setStats] = useState<VehicleStatistics | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getVehicles()
      .then((data) => { if (!cancelled) { setVehicles(data); setVehicleId(data[0]?.id ?? ''); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load vehicles.'); })
      .finally(() => { if (!cancelled) setLoadingVehicles(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!vehicleId) { setStats(null); return; }
    let cancelled = false;
    setLoadingStats(true);
    setError('');
    setStats(null);
    getVehicleStatistics(vehicleId)
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load statistics.'); })
      .finally(() => { if (!cancelled) setLoadingStats(false); });
    return () => { cancelled = true; };
  }, [vehicleId]);

  const maxMonthly = useMemo(() =>
    Math.max(1, ...(stats?.monthlySpending.map((m) => m.totalCostMillimes) ?? [])),
    [stats]
  );

  const totalFuelPct = stats && stats.ownershipCosts.totalCostMillimes
    ? (stats.ownershipCosts.fuelCostMillimes / stats.ownershipCosts.totalCostMillimes) * 100 : 0;
  const partsPct = stats && stats.ownershipCosts.totalCostMillimes
    ? (stats.maintenance.partsCostMillimes / stats.ownershipCosts.totalCostMillimes) * 100 : 0;
  const laborPct = stats && stats.ownershipCosts.totalCostMillimes
    ? (stats.maintenance.laborCostMillimes / stats.ownershipCosts.totalCostMillimes) * 100 : 0;

  if (loadingVehicles) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <LoaderCircle size={20} className="spinner" style={{ color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>Statistics</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>Mileage, fuel spend, and maintenance costs.</p>
        </div>

        {vehicles.length > 0 && (
          <FieldSelect
            value={vehicleId}
            onChange={setVehicleId}
            style={{ maxWidth: '260px', margin: 0 }}
            disabled={vehicles.length === 0}
            options={vehicles.map((v) => ({
              value: v.id,
              label: `${v.make} ${v.model} (${v.year})`,
            }))}
          />
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="card empty-state">
          <Car size={28} color="var(--text-tertiary)" />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Add a vehicle in your Garage to view statistics.</p>
        </div>
      )}

      {loadingStats && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-tertiary)', gap: '10px' }}>
          <LoaderCircle size={18} className="spinner" />
          <span style={{ fontSize: '13.5px' }}>Loading statistics…</span>
        </div>
      )}

      {!loadingStats && stats && (
        <>
          {/* Vehicle info strip */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{stats.vehicle.make} {stats.vehicle.model}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)',marginTop: '2px'}}>{stats.vehicle.year} <span style={{ margin: '0 6px' }}>·</span> <TunisianPlate plate={stats.vehicle.licensePlate}/></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'var(--bg-inset)', borderRadius: '8px' }}>
              <Gauge size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatNum(stats.vehicle.currentMileage)} km</span>
            </div>
          </div>

          {/* Key stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <StatCard label="Total ownership costs" value={formatMoney(stats.ownershipCosts.totalCostMillimes)} sub="Recorded fuel + maintenance" icon={Activity} accent />
            <StatCard label="Fuel spending" value={formatMoney(stats.fuel.totalCostMillimes)} sub={`${formatNum(stats.fuel.recordsCount)} records`} icon={Fuel} />
            <StatCard label="Maintenance" value={formatMoney(stats.maintenance.totalCostMillimes)} sub={`${formatNum(stats.maintenance.recordsCount)} records`} icon={Wrench} />
            <StatCard label="Litres purchased" value={`${formatNum(stats.fuel.totalLiters)} L`} sub="Total recorded" icon={TrendingUp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Monthly spending */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Monthly spending</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Last 6 calendar months</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {stats.monthlySpending.map((m) => (
                  <div key={m.month}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatMonth(m.month)}</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(m.totalCostMillimes)}</span>
                    </div>
                    <div className="progress-track">
                      <div style={{ display: 'flex', height: '100%' }}>
                        <div
                          className="progress-fill"
                          style={{ width: `${(m.fuelCostMillimes / maxMonthly) * 100}%`, background: 'var(--accent)' }}
                          title={`Fuel: ${formatMoney(m.fuelCostMillimes)}`}
                        />
                        <div
                          className="progress-fill"
                          style={{ width: `${(m.maintenanceCostMillimes / maxMonthly) * 100}%`, background: '#8B5CF6' }}
                          title={`Maintenance: ${formatMoney(m.maintenanceCostMillimes)}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                {[{ label: 'Fuel', color: 'var(--accent)' }, { label: 'Maintenance', color: '#8B5CF6' }].map(({ label, color }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Cost breakdown</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>By category</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Fuel', value: stats.ownershipCosts.fuelCostMillimes, pct: totalFuelPct, color: 'var(--accent)' },
                  { label: 'Parts', value: stats.maintenance.partsCostMillimes, pct: partsPct, color: '#8B5CF6' },
                  { label: 'Labor', value: stats.maintenance.laborCostMillimes, pct: laborPct, color: 'var(--amber)' },
                ].map(({ label, value, pct, color }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(value)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Total recorded</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>
                  {formatMoney(stats.ownershipCosts.totalCostMillimes)}
                </span>
              </div>
            </div>
          </div>

          {/* Recent maintenance */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '14px' }}>
              Recent maintenance
            </div>
            {stats.maintenance.history.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>No maintenance records yet.</p>
              </div>
            ) : (
              [...stats.maintenance.history].reverse().slice(0, 5).map((r, i, arr) => (
                <div
                  key={r.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{r.itemName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {new Date(r.maintenanceDate).toLocaleDateString('en-GB')} · {formatNum(r.mileage)} km
                      {r.category && ` · ${r.category}`}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {formatMoney(r.partCostMillimes + r.laborCostMillimes)}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}