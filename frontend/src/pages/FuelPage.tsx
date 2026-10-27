import { useCallback, useEffect, useState } from 'react';
import {
  Fuel,
  Plus,
  LoaderCircle,
  AlertCircle,
  Droplets,
  Car,
  X,
  TrendingUp,
} from 'lucide-react';

import { getVehicles } from '../lib/vehicles';
import { getFuelLogs, createFuelLog } from '../lib/fuel';
import type { Vehicle } from '../types/vehicle';
import type { FuelLog } from '../types/fuel';

function formatMoney(millimes: number) {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(millimes / 1000);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const EMPTY_FORM = {
  date: new Date().toLocaleDateString('en-CA'),
  mileage: '',
  liters: '',
  cost: '',
  fuelType: '',
  note: '',
};

export default function FuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    async function load() {
      try {
        const data = await getVehicles();
        setVehicles(data);
        setVehicleId(data[0]?.id ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vehicles.');
      } finally {
        setLoadingVehicles(false);
      }
    }
    void load();
  }, []);

  const loadLogs = useCallback(async (id: string) => {
    if (!id) { setLogs([]); return; }
    setLoadingLogs(true);
    setError('');
    try {
      setLogs(await getFuelLogs(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fuel logs.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => { void loadLogs(vehicleId); }, [vehicleId, loadLogs]);

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const totalCost = logs.reduce((s, l) => s + l.totalCostMillimes, 0);
  const totalLiters = logs.reduce((s, l) => s + l.liters, 0);
  const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters / 1000 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !vehicle) return;

    const mileage = Number(form.mileage);
    const liters = Number(form.liters);
    const cost = Number(form.cost);

    if (!Number.isInteger(mileage) || mileage < vehicle.currentMileage) {
      setError(`Mileage must be at least ${vehicle.currentMileage} km.`);
      return;
    }
    if (!Number.isFinite(liters) || liters <= 0) {
      setError('Enter a valid fuel quantity.');
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      setError('Enter a valid cost.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createFuelLog(vehicleId, {
        date: new Date(`${form.date}T12:00:00`).toISOString(),
        mileage,
        liters,
        totalCostMillimes: Math.round(cost * 1000),
        fuelType: form.fuelType || undefined,
        note: form.note.trim() || undefined,
      });
      setModalOpen(false);
      setForm({ ...EMPTY_FORM });
      await loadLogs(vehicleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fuel log.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>Fuel Tracking</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Record refuels, track costs and consumption.
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!vehicleId} onClick={() => { setError(''); setForm({ ...EMPTY_FORM }); setModalOpen(true); }}>
          <Plus size={15} />
          Log refuel
        </button>
      </div>

      {error && !modalOpen && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Vehicle selector */}
      {!loadingVehicles && vehicles.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', flexShrink: 0 }}>
              <Car size={15} />
              Vehicle
            </div>
            <select
              className="field-input field-select"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              style={{ maxWidth: '300px', margin: 0, flex: '1' }}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year}) — {v.licensePlate}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loadingVehicles ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
          <LoaderCircle size={20} className="spinner" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card empty-state">
          <Car size={28} color="var(--text-tertiary)" />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Add a vehicle in your Garage first.</p>
        </div>
      ) : vehicle && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total spent', value: formatMoney(totalCost), icon: <Fuel size={16} /> },
              { label: 'Total litres', value: `${totalLiters.toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`, icon: <Droplets size={16} /> },
              { label: 'Avg cost/litre', value: `${avgCostPerLiter.toFixed(3)} TND`, icon: <TrendingUp size={16} /> },
              { label: 'Records', value: String(logs.length), icon: <Fuel size={16} /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>{icon}</span>
                </div>
                <div className="stat-value" style={{ fontSize: '20px' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Log list */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Fuel history</span>
              {loadingLogs && <LoaderCircle size={15} className="spinner" style={{ color: 'var(--text-tertiary)' }} />}
            </div>

            {!loadingLogs && logs.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <Droplets size={28} color="var(--text-tertiary)" />
                <p style={{ marginTop: '10px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>No fuel records yet. Log your first refuel.</p>
              </div>
            ) : (
              <div>
                {logs.map((log, i) => (
                  <div key={log.id} style={{
                    padding: '14px 20px',
                    borderBottom: i < logs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'var(--amber-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Fuel size={15} color="var(--amber)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {log.liters.toLocaleString('fr-TN', { minimumFractionDigits: 1 })} L
                          {log.fuelType && (
                            <span className="badge badge-neutral">{log.fuelType}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {formatDate(log.date)} · {log.mileage.toLocaleString()} km
                          {log.note ? ` · ${log.note}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--amber)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(log.totalCostMillimes)}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {(log.totalCostMillimes / log.liters / 1000).toFixed(3)} TND/L
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && vehicle && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setModalOpen(false); }}
        >
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Log refuel</h2>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {vehicle.make} {vehicle.model} · {vehicle.currentMileage.toLocaleString()} km current
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '6px' }} disabled={saving} onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Date</label>
                  <input type="date" className="field-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Odometer (km)</label>
                  <input type="number" className="field-input" required min={vehicle.currentMileage} step={1} placeholder={`≥ ${vehicle.currentMileage}`} value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Litres</label>
                  <input type="number" className="field-input" required min="0.001" step="0.001" placeholder="e.g. 35.000" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Total cost (TND)</label>
                  <input type="number" className="field-input" required min="0.001" step="0.001" placeholder="e.g. 75.000" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="field-label">Fuel type</label>
                <select className="field-input field-select" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                  <option value="">Select (optional)</option>
                  <option value="Essence">Essence</option>
                  <option value="Gasoil">Gasoil</option>
                  <option value="Gasoil 50">Gasoil 50</option>
                  <option value="GPL">GPL</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="field-label">Note (optional)</label>
                <input className="field-input" maxLength={255} placeholder="e.g. Full tank" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} disabled={saving} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving && <LoaderCircle size={14} className="spinner" />}
                  {saving ? 'Saving…' : 'Save refuel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}