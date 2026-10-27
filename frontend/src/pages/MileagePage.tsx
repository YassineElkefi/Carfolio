import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Car,
  Gauge,
  LoaderCircle,
  Plus,
  Route,
  X,
} from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';

import { createMileageRecord, getMileageHistory } from '../lib/mileage';
import { getVehicles } from '../lib/vehicles';
import { showToast } from '../lib/notifications';
import { modalBackdropVariants, modalVariants } from '../lib/motion';
import { FieldCheckbox, FieldDate, FieldInput, FieldNumber, FieldSelect } from '../components/FormFields';
import type { MileageRecord } from '../types/mileage';
import type { Vehicle } from '../types/vehicle';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLocalDateString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

export default function MileagePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [records, setRecords] = useState<MileageRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mileage, setMileage] = useState('');
  const [note, setNote] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [recordedDate, setRecordedDate] = useState(getLocalDateString);

  useEffect(() => {
    async function loadVehicles() {
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

    void loadVehicles();
  }, []);

  const loadRecords = useCallback(async (id: string) => {
    if (!id) {
      setRecords([]);
      return;
    }

    setLoadingRecords(true);
    setError('');
    try {
      setRecords(await getMileageHistory(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mileage history.');
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords(vehicleId);
  }, [vehicleId, loadRecords]);

  const vehicle = vehicles.find((item) => item.id === vehicleId);

  function openModal() {
    setMileage(vehicle?.currentMileage.toString() ?? '');
    setNote('');
    setUseCustomDate(false);
    setRecordedDate(getLocalDateString());
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!vehicleId || !vehicle) return;

    const value = Number(mileage);
    if (!Number.isInteger(value) || value < vehicle.currentMileage) {
      setError(`Mileage must be at least ${vehicle.currentMileage.toLocaleString()} km.`);
      return;
    }
    if (useCustomDate && !recordedDate) {
      setError('Select a date for this mileage record.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const record = await createMileageRecord(vehicleId, {
        mileage: value,
        note: note.trim() || undefined,
        recordedAt: useCustomDate
          ? new Date(`${recordedDate}T12:00:00`).toISOString()
          : undefined,
      });
      setVehicles((current) =>
        current.map((item) =>
          item.id === vehicleId ? { ...item, currentMileage: record.mileage } : item,
        ),
      );
      setModalOpen(false);
      void loadRecords(vehicleId);
      void showToast('Mileage record added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mileage record.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>Mileage Tracking</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Keep an odometer history for each vehicle.
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!vehicleId} onClick={openModal}>
          <Plus size={15} />
          Add mileage
        </button>
      </div>

      {error && !modalOpen && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {!loadingVehicles && vehicles.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', flexShrink: 0 }}>
              <Car size={15} />
              Vehicle
            </div>
            <FieldSelect
              value={vehicleId}
              onChange={(nextId) => {
                setVehicleId(nextId);
                setMileage(vehicles.find((item) => item.id === nextId)?.currentMileage.toString() ?? '');
              }}
              style={{ maxWidth: '300px', margin: 0, flex: '1' }}
              options={vehicles.map((item) => ({
                value: item.id,
                label: `${item.make} ${item.model} (${item.year}) — ${item.licensePlate}`,
              }))}
            />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Current odometer', value: `${vehicle.currentMileage.toLocaleString()} km`, icon: <Gauge size={16} /> },
              { label: 'Mileage records', value: String(records.length), icon: <Route size={16} /> },
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

          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Mileage history</span>
              {loadingRecords && <LoaderCircle size={15} className="spinner" style={{ color: 'var(--text-tertiary)' }} />}
            </div>

            {!loadingRecords && records.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <Gauge size={28} color="var(--text-tertiary)" />
                <p style={{ marginTop: '10px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                  No mileage records yet. Add your first odometer reading.
                </p>
              </div>
            ) : (
              <div>
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: index < records.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'var(--accent-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Gauge size={15} color="var(--accent)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatDate(record.recordedAt)}
                        </div>
                        {record.note && (
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {record.note}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {record.mileage.toLocaleString()} km
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {modalOpen && vehicle && (
          <m.div
            className="modal-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) setModalOpen(false);
            }}
          >
            <m.div className="modal" variants={modalVariants}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Add mileage</h2>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {vehicle.make} {vehicle.model} · {vehicle.currentMileage.toLocaleString()} km current
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '6px' }} disabled={saving} onClick={() => setModalOpen(false)} aria-label="Close">
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
                <div>
                  <label className="field-label" htmlFor="mileage-value">Odometer reading (km)</label>
                  <FieldNumber
                    id="mileage-value"
                    required
                    min={vehicle.currentMileage}
                    step={1}
                    placeholder={`At least ${vehicle.currentMileage}`}
                    value={mileage}
                    onChange={setMileage}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="mileage-note">Note (optional)</label>
                  <FieldInput
                    id="mileage-note"
                    maxLength={255}
                    placeholder="e.g. Annual inspection"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>

                <FieldCheckbox checked={useCustomDate} onChange={setUseCustomDate}>
                  Choose a specific date
                </FieldCheckbox>

                {useCustomDate ? (
                  <div>
                    <label className="field-label" htmlFor="mileage-date">Date</label>
                    <FieldDate
                      id="mileage-date"
                      required
                      value={recordedDate}
                      onChange={setRecordedDate}
                    />
                  </div>
                ) : (
                  <p style={{ margin: '-4px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Today&apos;s date will be saved automatically.
                  </p>
                )}

                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} disabled={saving} onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                    {saving && <LoaderCircle size={14} className="spinner" />}
                    {saving ? 'Saving…' : 'Save mileage'}
                  </button>
                </div>
              </form>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
