import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  Edit2,
  Trash2,
  Check,
  X,
  LoaderCircle,
  Car,
  AlertCircle,
} from 'lucide-react';

import { getVehicles } from '../lib/vehicles';
import {
  getDeadlines,
  createDeadline,
  updateDeadline,
  completeDeadline,
  deleteDeadline,
} from '../lib/deadlines';

import type { Vehicle } from '../types/vehicle';
import type { VehicleDeadline, DeadlineType, CreateDeadlineData } from '../types/deadline';
import { confirmAction, showToast } from '../lib/notifications';
import { modalBackdropVariants, modalVariants } from '../lib/motion';
import { AnimatePresence, m } from 'framer-motion';
import { FieldCheckbox, FieldDate, FieldInput, FieldNumber, FieldSelect, FieldTextarea } from '../components/FormFields';

const DEADLINE_TYPES: { value: DeadlineType; label: string }[] = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'technical_inspection', label: 'Technical inspection' },
  { value: 'road_tax', label: 'Road tax' },
  { value: 'maintenance', label: 'Maintenance' },
];

const EMPTY_FORM = {
  type: 'insurance' as DeadlineType,
  title: '',
  dueDate: '',
  dueMileage: '',
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

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDaysRemaining(date: string | null) {
  if (!date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(date); due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function getStatus(deadline: VehicleDeadline) {
  if (deadline.completedAt) return { label: 'Completed', badge: 'badge-green' as const };
  if (deadline.dueDate) {
    const days = getDaysRemaining(deadline.dueDate) ?? 0;
    if (days < 0) return { label: 'Overdue', badge: 'badge-red' as const };
    if (days <= 30) return { label: 'Due soon', badge: 'badge-amber' as const };
  }
  return { label: 'Upcoming', badge: 'badge-blue' as const };
}

export default function DeadlinesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [deadlines, setDeadlines] = useState<VehicleDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<VehicleDeadline | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filter, setFilter] = useState<'all' | DeadlineType>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
      setVehicleId((curr) => (curr && data.some((v) => v.id === curr)) ? curr : (data[0]?.id ?? ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles.');
    }
  }, []);

  const loadDeadlines = useCallback(async (id: string) => {
    setLoading(true);
    setError('');
    try {
      setDeadlines(await getDeadlines(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deadlines.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadVehicles(); }, [loadVehicles]);
  useEffect(() => {
    if (vehicleId) { void loadDeadlines(vehicleId); }
    else { setDeadlines([]); setLoading(false); }
  }, [vehicleId, loadDeadlines]);

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const filtered = useMemo(() => deadlines
    .filter((d) => filter === 'all' || d.type === filter)
    .filter((d) => showCompleted || !d.completedAt)
    .sort((a, b) => {
      if (a.completedAt && !b.completedAt) return 1;
      if (!a.completedAt && b.completedAt) return -1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return (a.dueMileage ?? Infinity) - (b.dueMileage ?? Infinity);
    }), [deadlines, filter, showCompleted]);

  const active = deadlines.filter((d) => !d.completedAt);
  const overdueCount = active.filter((d) => d.dueDate && (getDaysRemaining(d.dueDate) ?? 0) < 0).length;
  const dueSoonCount = active.filter((d) => { const days = getDaysRemaining(d.dueDate); return days !== null && days >= 0 && days <= 30; }).length;
  const totalCost = active.reduce((s, d) => s + d.amountMillimes, 0);

  function openCreate() {
    setEditingDeadline(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setModalOpen(true);
  }

  function openEdit(d: VehicleDeadline) {
    setEditingDeadline(d);
    setForm({
      type: d.type,
      title: d.title,
      dueDate: d.dueDate?.slice(0, 10) ?? '',
      dueMileage: d.dueMileage?.toString() ?? '',
      amount: (d.amountMillimes / 1000).toString(),
      notes: d.notes ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId) return;
    if (!form.dueDate && !form.dueMileage) { setError('Enter a due date, a due mileage, or both.'); return; }

    const amount = Number(form.amount || 0);
    const mileage = form.dueMileage ? Number(form.dueMileage) : undefined;
    if (!Number.isFinite(amount) || amount < 0) { setError('Enter a valid amount.'); return; }
    if (mileage !== undefined && (!Number.isInteger(mileage) || mileage < 0)) { setError('Due mileage must be a non-negative whole number.'); return; }

    const payload: CreateDeadlineData = {
      type: form.type,
      title: form.title.trim(),
      ...(form.dueDate && { dueDate: form.dueDate }),
      ...(mileage !== undefined && { dueMileage: mileage }),
      amountMillimes: Math.round(amount * 1000),
      notes: form.notes.trim(),
    };

    setSaving(true);
    setError('');
    try {
      if (editingDeadline) {
        await updateDeadline(vehicleId, editingDeadline.id, payload);
      } else {
        await createDeadline(vehicleId, payload);
      }
      setModalOpen(false);
      await loadDeadlines(vehicleId);
      void showToast(editingDeadline ? 'Deadline updated.' : 'Deadline created.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deadline.');
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(d: VehicleDeadline) {
    const confirmed = await confirmAction({
      title: 'Mark this deadline as complete?',
      text: `"${d.title}" will be moved to completed deadlines.`,
      confirmButtonText: 'Mark complete',
      icon: 'question',
    });
    if (!confirmed) return;
    const completedMileage = vehicle?.currentMileage;
    try {
      await completeDeadline(vehicleId, d.id, completedMileage !== undefined ? { completedMileage } : {});
      await loadDeadlines(vehicleId);
      void showToast(`"${d.title}" marked as completed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete deadline.');
    }
  }

  async function handleDelete(d: VehicleDeadline) {
    const confirmed = await confirmAction({
      title: 'Delete this deadline?',
      text: `Delete "${d.title}"? This cannot be undone.`,
      confirmButtonText: 'Delete deadline',
    });
    if (!confirmed) return;
    try {
      await deleteDeadline(vehicleId, d.id);
      setDeadlines((prev) => prev.filter((x) => x.id !== d.id));
      void showToast('Deadline deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deadline.');
    }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>Deadlines</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>Insurance, inspections, road tax, and maintenance reminders.</p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!vehicleId} onClick={openCreate}>
          <Plus size={15} />
          Add deadline
        </button>
      </div>

      {error && !modalOpen && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}
      {/* Vehicle selector */}
      {vehicles.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', flexShrink: 0 }}>
            <Car size={15} /> Vehicle
          </div>
          <FieldSelect
            value={vehicleId}
            onChange={setVehicleId}
            style={{ maxWidth: '300px', margin: 0, flex: 1 }}
            options={vehicles.map((v) => ({
              value: v.id,
              label: `${v.make} ${v.model} (${v.year}) — ${v.licensePlate}`,
            }))}
          />
        </div>
      )}

      {vehicles.length === 0 && !loading ? (
        <div className="card empty-state">
          <Car size={28} color="var(--text-tertiary)" />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Add a vehicle in your Garage first.</p>
        </div>
      ) : vehicleId && (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Active', value: active.length.toString(), icon: <Clock size={16} />, alert: false },
              { label: 'Overdue', value: overdueCount.toString(), icon: <AlertTriangle size={16} />, alert: overdueCount > 0 },
              { label: 'Due in 30 days', value: dueSoonCount.toString(), icon: <CalendarClock size={16} />, alert: false },
              { label: 'Est. costs', value: formatMoney(totalCost), icon: <Gauge size={16} />, alert: false },
            ].map(({ label, value, icon, alert }) => (
              <div key={label} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color: alert ? 'var(--red)' : 'var(--text-tertiary)' }}>{icon}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: alert ? 'var(--red)' : 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="card" style={{ marginBottom: '12px' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)' }}>
              <FieldSelect
                value={filter}
                onChange={(value) => setFilter(value as 'all' | DeadlineType)}
                style={{ maxWidth: '200px', margin: 0 }}
                options={[
                  { value: 'all', label: 'All categories' },
                  ...DEADLINE_TYPES,
                ]}
              />

              <FieldCheckbox checked={showCompleted} onChange={setShowCompleted}>
                Show completed
              </FieldCheckbox>
            </div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>{filtered.length} deadline{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px', color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
                <LoaderCircle size={18} className="spinner" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <CalendarClock size={28} color="var(--text-tertiary)" />
                <p style={{ marginTop: '10px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>No deadlines to show.</p>
                <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '14px' }} onClick={openCreate}>
                  <Plus size={14} /> Add deadline
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1px', background: 'var(--border-subtle)' }}>
                {filtered.map((d) => {
                  const status = getStatus(d);
                  const days = getDaysRemaining(d.dueDate);
                  const typeLabel = DEADLINE_TYPES.find((t) => t.value === d.type)?.label ?? d.type;
                  const isCompleted = !!d.completedAt;

                  return (
                    <div
                      key={d.id}
                      style={{
                        padding: '18px 20px',
                        background: 'var(--bg-surface)',
                        opacity: isCompleted ? 0.65 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px', flexWrap: 'wrap' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{typeLabel}</span>
                            <span className={`badge ${status.badge}`} style={{ fontSize: '11px' }}>{status.label}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{d.title}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                          <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '5px' }} onClick={() => openEdit(d)}>
                            <Edit2 size={13} />
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '5px', color: 'var(--red)' }} onClick={() => void handleDelete(d)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ padding: '10px', background: 'var(--bg-inset)', borderRadius: '7px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Due date</div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{formatDate(d.dueDate)}</div>
                          {!isCompleted && days !== null && (
                            <div style={{ fontSize: '11px', marginTop: '2px', color: days < 0 ? 'var(--red)' : days <= 30 ? 'var(--amber)' : 'var(--text-tertiary)' }}>
                              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d remaining`}
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '10px', background: 'var(--bg-inset)', borderRadius: '7px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Due mileage</div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>
                            {d.dueMileage !== null ? `${d.dueMileage.toLocaleString()} km` : '—'}
                          </div>
                        </div>
                      </div>

                      {d.amountMillimes > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Est. cost</span>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(d.amountMillimes)}</span>
                        </div>
                      )}

                      {d.notes && (
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>{d.notes}</p>
                      )}

                      {isCompleted ? (
                        <div style={{ fontSize: '12px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle2 size={13} />
                          Completed {formatDate(d.completedAt)}
                          {d.completedMileage !== null && ` at ${d.completedMileage.toLocaleString()} km`}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleComplete(d)}
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', justifyContent: 'center', color: 'var(--green)', borderColor: 'var(--green)', gap: '6px' }}
                        >
                          <Check size={14} />
                          Mark completed
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
        <m.div
          className="modal-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setModalOpen(false); }}
        >
          <m.div className="modal" variants={modalVariants}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingDeadline ? 'Edit deadline' : 'Add deadline'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Enter a due date, mileage, or both.</p>
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
              <div>
                <label className="field-label">Category</label>
                <FieldSelect
                  required
                  value={form.type}
                  onChange={(type) => setForm({ ...form, type: type as DeadlineType })}
                  options={DEADLINE_TYPES}
                />
              </div>
              <div>
                <label className="field-label">Title</label>
                <FieldInput required maxLength={150} placeholder="e.g. Insurance renewal" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Due date</label>
                  <FieldDate value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
                </div>
                <div>
                  <label className="field-label">Due mileage (km)</label>
                  <FieldNumber min={0} step={1} placeholder="e.g. 90000" value={form.dueMileage} onChange={(dueMileage) => setForm({ ...form, dueMileage })} />
                </div>
              </div>
              <div>
                <label className="field-label">Estimated cost (TND)</label>
                <FieldNumber min={0} step="0.001" placeholder="0.000" value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
              </div>
              <div>
                <label className="field-label">Notes (optional)</label>
                <FieldTextarea rows={3} maxLength={1000} placeholder="Additional details…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} disabled={saving} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving && <LoaderCircle size={14} className="spinner" />}
                  {saving ? 'Saving…' : editingDeadline ? 'Save changes' : 'Create deadline'}
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