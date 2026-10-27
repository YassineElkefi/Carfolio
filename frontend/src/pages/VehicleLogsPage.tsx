import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Car,
  ClipboardCheck,
  Droplets,
  FileText,
  Gauge,
  LoaderCircle,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';

import {
  FieldDate,
  FieldNumber,
  FieldSelect,
  FieldTextarea,
} from '../components/FormFields';
import { confirmAction, showToast } from '../lib/notifications';
import { modalBackdropVariants, modalVariants } from '../lib/motion';
import {
  createVehicleLog,
  deleteVehicleLog,
  getVehicleLogs,
  updateVehicleLog,
} from '../lib/vehicleLogs';
import { getVehicles } from '../lib/vehicles';
import type { Vehicle } from '../types/vehicle';
import type {
  CreateVehicleLogData,
  VehicleLog,
  VehicleLogType,
} from '../types/vehicleLog';

const LOG_TYPES: {
  value: VehicleLogType;
  label: string;
  singular: string;
  icon: typeof ClipboardCheck;
  needsMileage: boolean;
}[] = [
  {
    value: 'technical_inspection',
    label: 'Technical inspections',
    singular: 'Technical inspection',
    icon: ClipboardCheck,
    needsMileage: true,
  },
  {
    value: 'oil_filter_change',
    label: 'Oil & filters',
    singular: 'Oil & filter change',
    icon: Droplets,
    needsMileage: true,
  },
  {
    value: 'road_tax',
    label: 'Road tax',
    singular: 'Road tax payment',
    icon: Receipt,
    needsMileage: false,
  },
];

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  mileage: '',
  amount: '',
  notes: '',
};

function formatMoney(millimes: number) {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(millimes / 1000);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function sortLogs(logs: VehicleLog[]) {
  return logs.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export default function VehicleLogsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [logs, setLogs] = useState<VehicleLog[]>([]);
  const [loadedVehicleId, setLoadedVehicleId] = useState('');
  const [activeType, setActiveType] = useState<VehicleLogType>(
    'technical_inspection',
  );
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<VehicleLog | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      try {
        const data = await getVehicles();
        if (!cancelled) {
          setVehicles(data);
          setVehicleId(data[0]?.id ?? '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load vehicles.');
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
    let cancelled = false;

    if (!vehicleId) return;

    getVehicleLogs(vehicleId)
      .then((data) => {
        if (!cancelled) {
          setLogs(data);
          setError('');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load logs.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedVehicleId(vehicleId);
      });

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const activeConfig = LOG_TYPES.find((type) => type.value === activeType)!;
  const activeLogs = useMemo(
    () => logs.filter((log) => log.type === activeType),
    [logs, activeType],
  );
  const totalSpent = activeLogs.reduce(
    (total, log) => total + log.amountMillimes,
    0,
  );
  const vehicle = vehicles.find((item) => item.id === vehicleId);
  const loadingLogs = Boolean(vehicleId && vehicleId !== loadedVehicleId);

  function openCreate() {
    setEditingLog(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setModalOpen(true);
  }

  function openEdit(log: VehicleLog) {
    setEditingLog(log);
    setForm({
      date: log.date.slice(0, 10),
      mileage: log.mileage?.toString() ?? '',
      amount: (log.amountMillimes / 1000).toString(),
      notes: log.notes ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!vehicleId) return;

    const amount = Number(form.amount);
    const mileage = form.mileage === '' ? undefined : Number(form.mileage);
    if (!form.date) {
      setError('Enter the date for this record.');
      return;
    }
    if (form.amount.trim() === '' || !Number.isFinite(amount) || amount < 0) {
      setError('Enter a valid amount paid.');
      return;
    }
    if (
      activeConfig.needsMileage &&
      (mileage === undefined || !Number.isInteger(mileage) || mileage < 0)
    ) {
      setError('Enter a valid non-negative mileage.');
      return;
    }

    const data: CreateVehicleLogData = {
      type: activeType,
      date: form.date,
      amountMillimes: Math.round(amount * 1000),
      ...(activeConfig.needsMileage && mileage !== undefined && { mileage }),
      notes: form.notes.trim(),
    };

    setSaving(true);
    setError('');
    try {
      let saved: VehicleLog;
      if (editingLog) {
        saved = await updateVehicleLog(vehicleId, editingLog.id, data);
      } else {
        saved = await createVehicleLog(vehicleId, data);
      }
      setLogs((current) =>
        sortLogs([...current.filter((log) => log.id !== saved.id), saved]),
      );
      setModalOpen(false);
      void showToast(
        editingLog
          ? `${activeConfig.singular} log updated.`
          : `${activeConfig.singular} log added.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save log.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(log: VehicleLog) {
    const confirmed = await confirmAction({
      title: 'Delete this log entry?',
      text: `Delete this ${activeConfig.singular.toLowerCase()} record? This cannot be undone.`,
      confirmButtonText: 'Delete record',
    });
    if (!confirmed) return;

    try {
      await deleteVehicleLog(vehicleId, log.id);
      setLogs((current) => current.filter((entry) => entry.id !== log.id));
      void showToast(`${activeConfig.singular} log deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete log.');
    }
  }

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '28px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.4px',
              color: 'var(--text-primary)',
            }}
          >
            Vehicle logs
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
            }}
          >
            Keep a separate history of inspections, oil & filters, and road tax.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!vehicleId}
          onClick={openCreate}
        >
          <Plus size={15} />
          Add {activeConfig.singular.toLowerCase()}
        </button>
      </div>

      {error && !modalOpen && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {!loadingVehicles && vehicles.length > 0 && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            <Car size={15} />
            Vehicle
          </div>
          <FieldSelect
            value={vehicleId}
            onChange={setVehicleId}
            style={{ maxWidth: '300px', margin: 0, flex: 1 }}
            options={vehicles.map((item) => ({
              value: item.id,
              label: `${item.make} ${item.model} (${item.year}) — ${item.licensePlate}`,
            }))}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                Entries
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>
                {activeLogs.length}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                Total paid
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {formatMoney(totalSpent)}
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingVehicles ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '60px',
            color: 'var(--text-tertiary)',
          }}
        >
          <LoaderCircle size={20} className="spinner" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card empty-state">
          <Car size={28} color="var(--text-tertiary)" />
          <p
            style={{
              marginTop: '12px',
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
            }}
          >
            Add a vehicle in your Garage first.
          </p>
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Vehicle log type"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              marginBottom: '16px',
            }}
          >
            {LOG_TYPES.map((type) => {
              const Icon = type.icon;
              const selected = type.value === activeType;
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  key={type.value}
                  className={`btn btn-secondary${selected ? ' active' : ''}`}
                  style={
                    selected
                      ? {
                          color: 'var(--accent)',
                          borderColor: 'var(--accent)',
                          background: 'var(--accent-light)',
                          whiteSpace: 'nowrap',
                        }
                      : { whiteSpace: 'nowrap' }
                  }
                  onClick={() => setActiveType(type.value)}
                >
                  <Icon size={15} />
                  {type.label}
                </button>
              );
            })}
          </div>

          <div className="card">
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-tertiary)',
                fontSize: '12.5px',
              }}
            >
              <span>
                {activeLogs.length} {activeConfig.singular.toLowerCase()} entr
                {activeLogs.length === 1 ? 'y' : 'ies'}
                {vehicle ? ` for ${vehicle.make} ${vehicle.model}` : ''}
              </span>
              {loadingLogs && (
                <LoaderCircle
                  size={14}
                  className="spinner"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              )}
            </div>

            {loadingLogs ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <LoaderCircle
                  size={20}
                  className="spinner"
                  color="var(--text-tertiary)"
                />
              </div>
            ) : activeLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '50px 24px' }}>
                <FileText size={28} color="var(--text-tertiary)" />
                <p
                  style={{
                    marginTop: '10px',
                    fontSize: '13.5px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  No {activeConfig.label.toLowerCase()} logged yet.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '14px' }}
                  onClick={openCreate}
                >
                  <Plus size={14} /> Add first entry
                </button>
              </div>
            ) : (
              activeLogs.map((log, index) => (
                <div
                  key={log.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom:
                      index < activeLogs.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {activeConfig.needsMileage ? (
                      <Gauge size={16} color="var(--accent)" />
                    ) : (
                      <CalendarDays size={16} color="var(--accent)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '13.5px',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {activeConfig.singular}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-tertiary)',
                            marginTop: '3px',
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>{formatDate(log.date)}</span>
                          {log.mileage !== null && (
                            <>
                              <span>·</span>
                              <span>{log.mileage.toLocaleString()} km</span>
                            </>
                          )}
                        </div>
                        {log.notes && (
                          <div
                            style={{
                              fontSize: '12.5px',
                              color: 'var(--text-secondary)',
                              marginTop: '6px',
                            }}
                          >
                            {log.notes}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--accent)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {formatMoney(log.amountMillimes)}
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px' }}
                          aria-label={`Edit ${activeConfig.singular.toLowerCase()} log`}
                          onClick={() => openEdit(log)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', color: 'var(--red)' }}
                          aria-label={`Delete ${activeConfig.singular.toLowerCase()} log`}
                          onClick={() => void handleDelete(log)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
              if (event.target === event.currentTarget && !saving) {
                setModalOpen(false);
              }
            }}
          >
            <m.div className="modal" style={{ maxWidth: '520px' }} variants={modalVariants}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {editingLog ? 'Edit log entry' : `Add ${activeConfig.singular.toLowerCase()}`}
                  </h2>
                  <p
                    style={{
                      margin: '3px 0 0',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {vehicle.make} {vehicle.model} · {vehicle.licensePlate}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label="Close"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <form onSubmit={(event) => void handleSubmit(event)}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: activeConfig.needsMileage
                      ? 'repeat(2, minmax(0, 1fr))'
                      : '1fr',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label className="field-label">Date</label>
                    <FieldDate
                      value={form.date}
                      onChange={(date) => setForm((current) => ({ ...current, date }))}
                      required
                      disabled={saving}
                    />
                  </div>
                  {activeConfig.needsMileage && (
                    <div>
                      <label className="field-label">Mileage (km)</label>
                      <FieldNumber
                        min={0}
                        step={1}
                        value={form.mileage}
                        onChange={(mileage) =>
                          setForm((current) => ({ ...current, mileage }))
                        }
                        placeholder="e.g. 85000"
                        required
                        disabled={saving}
                      />
                    </div>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Amount paid (TND)</label>
                    <FieldNumber
                      min={0}
                      step={0.001}
                      value={form.amount}
                      onChange={(amount) =>
                        setForm((current) => ({ ...current, amount }))
                      }
                      placeholder="e.g. 120.000"
                      required
                      disabled={saving}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Notes (optional)</label>
                    <FieldTextarea
                      rows={3}
                      maxLength={1000}
                      placeholder="Add a note…"
                      value={form.notes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      style={{ resize: 'vertical' }}
                      disabled={saving}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    marginTop: '20px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving && <LoaderCircle size={15} className="spinner" />}
                    {editingLog ? 'Save changes' : 'Add entry'}
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
