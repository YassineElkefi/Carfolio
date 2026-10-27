import { useCallback, useEffect, useState } from 'react';
import {
  Car,
  Plus,
  Gauge,
  Fuel,
  Wrench,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  LoaderCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';

import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from './lib/vehicles';
import type { CreateVehicleData, Vehicle } from './types/vehicle';
import { TunisianPlate } from './lib/tunisianPlate';
import { confirmAction, showToast } from './lib/notifications';
import { modalBackdropVariants, modalVariants, staggerContainerVariants, staggerItemVariants } from './lib/motion';
import { FieldInput, FieldNumber } from './components/FormFields';

const EMPTY_FORM: CreateVehicleData = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  currentMileage: 0,
};

const CAR_COLORS = [
  '#64705c', '#8b705a', '#707e86', '#9a8060', '#73675e', '#66746b',
];

function getVehicleColor(id: string) {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CAR_COLORS[sum % CAR_COLORS.length];
}

export default function GaragePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateVehicleData>(EMPTY_FORM);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVehicles(await getVehicles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpenId) return;
    function handler() { setMenuOpenId(null); }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpenId]);

  function openAdd() {
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditingVehicle(v);
    setForm({ make: v.make, model: v.model, year: v.year, licensePlate: v.licensePlate, currentMileage: v.currentMileage });
    setError('');
    setModalOpen(true);
    setMenuOpenId(null);
  }

  async function handleDelete(v: Vehicle) {
    setMenuOpenId(null);
    const confirmed = await confirmAction({
      title: 'Remove this vehicle?',
      text: `Delete ${v.make} ${v.model}? This cannot be undone.`,
      confirmButtonText: 'Delete vehicle',
    });
    if (!confirmed) return;
    try {
      await deleteVehicle(v.id);
      await load();
      void showToast(`${v.make} ${v.model} deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, form);
      } else {
        await createVehicle(form);
      }
      setModalOpen(false);
      await load();
      void showToast(editingVehicle ? 'Vehicle details updated.' : 'Vehicle added to your garage.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page garage-page">
      <div className="garage-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
        <div>
          <span className="garage-kicker">Your collection</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>
            Your garage
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            {vehicles.length === 0 ? 'A considered home for every car you own.' : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} in your collection`}
          </p>
        </div>

        <button type="button" onClick={openAdd} className="btn btn-primary">
          <Plus size={15} />
          Add vehicle
        </button>
      </div>

      {error && !modalOpen && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '60px 0', color: 'var(--text-tertiary)', justifyContent: 'center' }}>
          <LoaderCircle size={20} className="spinner" />
          <span style={{ fontSize: '13.5px' }}>Loading vehicles…</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card empty-state">
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'var(--accent-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
          }}>
            <Car size={26} color="var(--accent)" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>Your garage is empty</h2>
          <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '280px' }}>
            Add your first vehicle to start tracking mileage, fuel, maintenance, and costs.
          </p>
          <button type="button" onClick={openAdd} className="btn btn-primary">
            <Plus size={15} />
            Add your first vehicle
          </button>
        </div>
      ) : (
        <m.div
          className="garage-grid"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          {vehicles.map((v) => {
            const color = getVehicleColor(v.id);
            return (
              <m.article
                key={v.id}
                className="card vehicle-card"
                variants={staggerItemVariants}
              >
                <div className="vehicle-card-rule" />

                <div className="vehicle-card-body">
                  <div className="vehicle-card-heading">
                    <div className="vehicle-identity">
                      <div className="vehicle-mark">
                        <Car size={20} style={{ color }} />
                      </div>
                      <div>
                        <div className="vehicle-name">
                          {v.make} {v.model}
                        </div>
                        <div className="vehicle-meta">
                          <span className="vehicle-year">{v.year}</span>
                          <TunisianPlate plate={v.licensePlate} />
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', borderRadius: '6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === v.id ? null : v.id);
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {menuOpenId === v.id && (
                        <div
                          className="card-elevated"
                          style={{
                            position: 'absolute', top: '100%', right: 0, zIndex: 20,
                            width: '160px', padding: '6px', marginTop: '4px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button type="button" className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '6px', gap: '8px' }} onClick={() => openEdit(v)}>
                            <Pencil size={14} /> Edit vehicle
                          </button>
                          <button type="button" className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '6px', gap: '8px', color: 'var(--red)' }} onClick={() => void handleDelete(v)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="vehicle-mileage">
                    <Gauge size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <div>
                      <div className="vehicle-mileage-label">Odometer</div>
                      <div className="vehicle-mileage-value">
                        {v.currentMileage.toLocaleString()} km
                      </div>
                    </div>
                  </div>

                  <div className="vehicle-quick-links">
                    {[
                      { to: '/fuel', icon: Fuel, label: 'Fuel' },
                      { to: '/mileage', icon: Gauge, label: 'Mileage' },
                      { to: '/maintenance', icon: Wrench, label: 'Parts' },
                      { to: '/deadlines', icon: CalendarLink, label: 'Reminders' },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          gap: '5px', padding: '10px 6px', borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          textDecoration: 'none', color: 'var(--text-secondary)',
                          fontSize: '11.5px', fontWeight: 500, transition: 'all 0.15s',
                        }}
                        className="vehicle-quick-link"
                      >
                        <Icon size={16} />
                        {label}
                      </Link>
                    ))}
                  </div>

                  <Link
                    to="/statistics"
                    className="vehicle-stat-link"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginTop: '12px', padding: '10px 12px', borderRadius: '8px',
                      background: 'var(--accent-light)', textDecoration: 'none',
                      color: 'var(--accent)', fontSize: '13px', fontWeight: 500,
                    }}
                  >
                    <span>View statistics</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </m.article>
            );
          })}
        </m.div>
      )}

      {/* Add / Edit modal */}
      <AnimatePresence>
        {modalOpen && (
        <m.div
          className="modal-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) setModalOpen(false); }}
        >
          <m.div className="modal" variants={modalVariants}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingVehicle ? 'Edit vehicle' : 'Add vehicle'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {editingVehicle ? 'Update the details below.' : 'Fill in the details to add a vehicle to your garage.'}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '6px' }} disabled={submitting} onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Make</label>
                  <FieldInput required placeholder="e.g. Citroën" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Model</label>
                  <FieldInput required placeholder="e.g. C3" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Year</label>
                  <FieldNumber required min={1886} max={new Date().getFullYear() + 1} value={form.year} onChange={(value) => setForm({ ...form, year: Number(value) })} />
                </div>
                <div>
                  <label className="field-label">Mileage (km)</label>
                  <FieldNumber required min={0} value={form.currentMileage} onChange={(value) => setForm({ ...form, currentMileage: Number(value) })} />
                </div>
              </div>

              <div>
                <label className="field-label">License plate</label>
                <FieldInput required placeholder="e.g. 123 TU 4567" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} disabled={submitting} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting && <LoaderCircle size={14} className="spinner" />}
                  {submitting ? 'Saving…' : editingVehicle ? 'Save changes' : 'Add vehicle'}
                </button>
              </div>
            </form>
          </m.div>
        </m.div>
        )}
      </AnimatePresence>

      <style>{`
        .vehicle-quick-link:hover {
          background: var(--bg-hover);
          border-color: var(--border-default);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}

// Inline icon to avoid extra import complexity
function CalendarLink(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
    </svg>
  );
}
