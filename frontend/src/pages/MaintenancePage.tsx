import { useEffect, useState } from 'react';
import {
  CarFront,
  CircleDot,
  CircleStop,
  Cog,
  Droplets,
  GitFork,
  MoveVertical,
  Package,
  Sparkles,
  Zap,
  Wrench,
  Plus,
  LoaderCircle,
  Car,
  Pencil,
  Trash2,
  Search,
  X,
  AlertCircle,
  SlidersHorizontal,
  LoaderPinwheel,
  Engine,
  Bubbles,
} from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';

import { getVehicles } from '../lib/vehicles';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../lib/maintenance';
import { confirmAction, showToast } from '../lib/notifications';
import { modalBackdropVariants, modalVariants } from '../lib/motion';
import { FieldDate, FieldInput, FieldNumber, FieldSelect } from '../components/FormFields';

import type { Vehicle } from '../types/vehicle';
import type { MaintenanceRecord, CreateMaintenanceData } from '../types/maintenance';

function formatMoney(millimes: number) {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(millimes / 1000);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const CATEGORIES = ['Engine', 'Brakes', 'Clutch & Transmission', 'Suspension', 'Electrical', 'Fluids & Filters', 'Tires', 'Bodywork', 'Car Wash', 'Other'];

const CATEGORY_ICONS: Record<string, typeof Wrench> = {
  Engine: Engine,
  Brakes: CircleStop,
  'Clutch & Transmission': GitFork,
  Suspension: MoveVertical,
  Electrical: Zap,
  'Fluids & Filters': Droplets,
  Tires: LoaderPinwheel,
  Bodywork: CarFront,
  'Car Wash': Bubbles,
  Other: Package,
};

function MaintenanceCategoryIcon({ category }: { category?: string }) {
  const Icon = CATEGORY_ICONS[category ?? ''] ?? Wrench;

  return <Icon size={15} color="var(--accent)" />;
}

const EMPTY_FORM = {
  itemName: '',
  category: '',
  purchaseDate: '',
  maintenanceDate: new Date().toISOString().slice(0, 10),
  mileage: '',
  partCost: '',
  laborCost: '',
  mechanicName: '',
  notes: '',
};

export default function MaintenancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    if (!vehicleId) { setRecords([]); return; }
    let cancelled = false;
    setLoadingRecords(true);
    setError('');

    getMaintenanceRecords(vehicleId)
      .then((data) => { if (!cancelled) setRecords(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load records.'); })
      .finally(() => { if (!cancelled) setLoadingRecords(false); });

    return () => { cancelled = true; };
  }, [vehicleId]);

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const filtered = records.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [r.itemName, r.mechanicName, r.notes, r.category].some((v) => v?.toLowerCase().includes(q));
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    const date = r.maintenanceDate.slice(0, 10);
    return matchesSearch && matchesCategory && (!filterStart || date >= filterStart) && (!filterEnd || date <= filterEnd);
  });

  const totalSpent = records.reduce((s, r) => s + r.partCostMillimes + r.laborCostMillimes, 0);

  function openAdd() {
    setEditingRecord(null);
    setForm({ ...EMPTY_FORM, mileage: vehicle?.currentMileage.toString() ?? '' });
    setError('');
    setModalOpen(true);
  }

  function openEdit(r: MaintenanceRecord) {
    setEditingRecord(r);
    setForm({
      itemName: r.itemName,
      category: r.category ?? '',
      purchaseDate: r.purchaseDate?.slice(0, 10) ?? '',
      maintenanceDate: r.maintenanceDate.slice(0, 10),
      mileage: String(r.mileage),
      partCost: String(r.partCostMillimes / 1000),
      laborCost: String(r.laborCostMillimes / 1000),
      mechanicName: r.mechanicName ?? '',
      notes: r.notes ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleDelete(r: MaintenanceRecord) {
    const confirmed = await confirmAction({
      title: 'Delete this maintenance record?',
      text: `Delete "${r.itemName}"? This cannot be undone.`,
      confirmButtonText: 'Delete record',
    });
    if (!confirmed) return;
    try {
      await deleteMaintenanceRecord(vehicleId, r.id);
      setRecords((prev) => prev.filter((x) => x.id !== r.id));
      void showToast('Maintenance record deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId) return;
    setSaving(true);
    setError('');

    const data: CreateMaintenanceData = {
      itemName: form.itemName.trim(),
      mileage: Number(form.mileage),
      ...(form.category && { category: form.category }),
      ...(form.purchaseDate && { purchaseDate: form.purchaseDate }),
      ...(form.maintenanceDate && { maintenanceDate: form.maintenanceDate }),
      ...(form.partCost !== '' && { partCostMillimes: Math.round(Number(form.partCost) * 1000) }),
      ...(form.laborCost !== '' && { laborCostMillimes: Math.round(Number(form.laborCost) * 1000) }),
      ...(form.mechanicName.trim() && { mechanicName: form.mechanicName.trim() }),
      ...(form.notes.trim() && { notes: form.notes.trim() }),
    };

    try {
      if (editingRecord) {
        const updated = await updateMaintenanceRecord(vehicleId, editingRecord.id, data);
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await createMaintenanceRecord(vehicleId, data);
        setRecords((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      void showToast(editingRecord ? 'Maintenance record updated.' : 'Maintenance record added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = search || filterCategory !== 'all' || filterStart || filterEnd;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>Maintenance</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Parts, repairs, and service history.
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!vehicleId} onClick={openAdd}>
          <Plus size={15} />
          Add record
        </button>
      </div>

      {error && !modalOpen && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Vehicle selector + summary */}
      {!loadingVehicles && vehicles.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', flexShrink: 0 }}>
            <Car size={15} />
            Vehicle
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

          {vehicle && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px', flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>Records</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{records.length}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>Total cost</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)' }}>{formatMoney(totalSpent)}</div>
              </div>
            </div>
          )}
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
      ) : (
        <div className="card">
          {/* Search + filter bar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <FieldInput
                style={{ paddingLeft: '32px', margin: 0 }}
                placeholder="Search parts, mechanics, notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={`btn btn-secondary btn-sm${showFilters ? ' active' : ''}`}
              style={showFilters ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-light)' } : {}}
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal size={14} />
              Filters
              {hasFilters && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
            </button>
            {hasFilters && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterCategory('all'); setFilterStart(''); setFilterEnd(''); }}>
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              <div>
                <label className="field-label">Category</label>
                <FieldSelect
                  value={filterCategory}
                  onChange={setFilterCategory}
                  style={{ margin: 0 }}
                  options={[
                    { value: 'all', label: 'All categories' },
                    ...CATEGORIES.map((category) => ({ value: category, label: category })),
                  ]}
                />
              </div>
              <div>
                <label className="field-label">From date</label>
                <FieldDate value={filterStart} max={filterEnd || undefined} onChange={setFilterStart} style={{ margin: 0 }} />
              </div>
              <div>
                <label className="field-label">To date</label>
                <FieldDate value={filterEnd} min={filterStart || undefined} onChange={setFilterEnd} style={{ margin: 0 }} />
              </div>
            </div>
          )}

          {/* List header */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
              {filtered.length} of {records.length} record{records.length !== 1 ? 's' : ''}
            </span>
            {loadingRecords && <LoaderCircle size={14} className="spinner" style={{ color: 'var(--text-tertiary)' }} />}
          </div>

          {/* Records */}
          {!loadingRecords && records.length === 0 ? (
            <div className="empty-state" style={{ padding: '50px 24px' }}>
              <Wrench size={28} color="var(--text-tertiary)" />
              <p style={{ marginTop: '10px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>No maintenance records yet.</p>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '14px' }} onClick={openAdd}>
                <Plus size={14} /> Add first record
              </button>
            </div>
          ) : !loadingRecords && filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>No records match your filters.</p>
            </div>
          ) : (
            filtered.map((r, i) => (
              <div
                key={r.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'var(--accent-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
                }}>
                  <MaintenanceCategoryIcon category={r.category ?? undefined} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{r.itemName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '3px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {r.category && <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{r.category}</span>}
                        <span>{formatDate(r.maintenanceDate)}</span>
                        <span>·</span>
                        <span>{r.mileage.toLocaleString()} km</span>
                        {r.mechanicName && <><span>·</span><span>{r.mechanicName}</span></>}
                      </div>
                      {r.notes && (
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>{r.notes}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatMoney(r.partCostMillimes + r.laborCostMillimes)}
                        </div>
                        {(r.partCostMillimes > 0 || r.laborCostMillimes > 0) && (
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            P: {formatMoney(r.partCostMillimes)} · L: {formatMoney(r.laborCostMillimes)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '6px' }} onClick={() => openEdit(r)}>
                          <Pencil size={13} />
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '6px', color: 'var(--red)' }} onClick={() => void handleDelete(r)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && vehicle && (
        <m.div
          className="modal-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setModalOpen(false); }}
        >
          <m.div className="modal" style={{ maxWidth: '580px' }} variants={modalVariants}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingRecord ? 'Edit record' : 'Add maintenance record'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {vehicle.make} {vehicle.model}
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
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">Part or service name</label>
                  <FieldInput required maxLength={150} placeholder="e.g. Clutch kit" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Category</label>
                  <FieldSelect
                    value={form.category}
                    onChange={(category) => setForm({ ...form, category })}
                    options={[
                      { value: '', label: 'Select category' },
                      ...CATEGORIES.map((category) => ({ value: category, label: category })),
                    ]}
                  />
                </div>
                <div>
                  <label className="field-label">Mileage (km)</label>
                  <FieldNumber required min={vehicle.currentMileage} step={1} value={form.mileage} onChange={(mileage) => setForm({ ...form, mileage })} />
                </div>
                <div>
                  <label className="field-label">Maintenance date</label>
                  <FieldDate value={form.maintenanceDate} onChange={(maintenanceDate) => setForm({ ...form, maintenanceDate })} />
                </div>
                <div>
                  <label className="field-label">Purchase date</label>
                  <FieldDate value={form.purchaseDate} onChange={(purchaseDate) => setForm({ ...form, purchaseDate })} />
                </div>
                <div>
                  <label className="field-label">Part cost (TND)</label>
                  <FieldNumber min={0} step="0.001" placeholder="0.000" value={form.partCost} onChange={(partCost) => setForm({ ...form, partCost })} />
                </div>
                <div>
                  <label className="field-label">Labor cost (TND)</label>
                  <FieldNumber min={0} step="0.001" placeholder="0.000" value={form.laborCost} onChange={(laborCost) => setForm({ ...form, laborCost })} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">Mechanic / garage</label>
                  <FieldInput maxLength={150} placeholder="Garage name" value={form.mechanicName} onChange={(e) => setForm({ ...form, mechanicName: e.target.value })} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">Notes</label>
                  <FieldInput maxLength={1000} placeholder="Brand, observations…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} disabled={saving} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving && <LoaderCircle size={14} className="spinner" />}
                  {saving ? 'Saving…' : editingRecord ? 'Save changes' : 'Add record'}
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