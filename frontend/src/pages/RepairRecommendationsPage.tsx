import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Car,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';

import {
  createRepairRecommendation,
  deleteRepairRecommendation,
  getRepairRecommendations,
  updateRepairRecommendation,
} from '../lib/repair-recommendations';
import { confirmAction, showToast } from '../lib/notifications';
import { modalBackdropVariants, modalVariants } from '../lib/motion';
import { getVehicles } from '../lib/vehicles';
import { FieldDate, FieldInput, FieldSelect } from '../components/FormFields';
import type { Vehicle } from '../types/vehicle';
import type {
  CreateRepairRecommendationData,
  RepairRecommendation,
} from '../types/repair-recommendation';

const EMPTY_FORM = {
  partName: '',
  mechanicName: '',
  recommendedAt: new Date().toISOString().slice(0, 10),
  isBought: false,
  isMounted: false,
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function RepairRecommendationsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [recommendations, setRecommendations] = useState<
    RepairRecommendation[]
  >([]);
  const [loadedVehicleId, setLoadedVehicleId] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RepairRecommendation | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getVehicles()
      .then((data) => {
        if (cancelled) return;
        setVehicles(data);
        setVehicleId(data[0]?.id ?? '');
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load vehicles.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingVehicles(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!vehicleId) return;

    let cancelled = false;

    getRepairRecommendations(vehicleId)
      .then((data) => {
        if (!cancelled) {
          setRecommendations(data);
          setLoadedVehicleId(vehicleId);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRecommendations([]);
          setLoadedVehicleId(vehicleId);
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load repair recommendations.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const vehicle = vehicles.find((item) => item.id === vehicleId);
  const loading = Boolean(vehicleId) && loadedVehicleId !== vehicleId;

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setModalOpen(true);
  }

  function openEdit(recommendation: RepairRecommendation) {
    setEditing(recommendation);
    setForm({
      partName: recommendation.partName,
      mechanicName: recommendation.mechanicName,
      recommendedAt: recommendation.recommendedAt.slice(0, 10),
      isBought: recommendation.isBought,
      isMounted: recommendation.isMounted,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const data: CreateRepairRecommendationData = {
      partName: form.partName.trim(),
      mechanicName: form.mechanicName.trim(),
      recommendedAt: form.recommendedAt,
      isBought: form.isBought,
      isMounted: form.isMounted,
    };

    try {
      if (editing) {
        const updated = await updateRepairRecommendation(
          vehicleId,
          editing.id,
          data,
        );
        setRecommendations((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        const created = await createRepairRecommendation(vehicleId, data);
        setRecommendations((previous) => [created, ...previous]);
      }

      setModalOpen(false);
      void showToast(
        editing
          ? 'Repair recommendation updated.'
          : 'Repair recommendation added.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save repair recommendation.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    recommendation: RepairRecommendation,
    field: 'isBought' | 'isMounted',
  ) {
    setSavingStatusId(recommendation.id);
    setError('');
    try {
      const updated = await updateRepairRecommendation(vehicleId, recommendation.id, {
        [field]: !recommendation[field],
      });
      setRecommendations((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update repair status.',
      );
    } finally {
      setSavingStatusId(null);
    }
  }

  async function handleDelete(recommendation: RepairRecommendation) {
    const confirmed = await confirmAction({
      title: 'Delete this repair recommendation?',
      text: `Delete "${recommendation.partName}"? This cannot be undone.`,
      confirmButtonText: 'Delete recommendation',
    });
    if (!confirmed) return;

    try {
      await deleteRepairRecommendation(vehicleId, recommendation.id);
      setRecommendations((previous) =>
        previous.filter((item) => item.id !== recommendation.id),
      );
      void showToast('Repair recommendation deleted.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete repair recommendation.',
      );
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.4px',
            color: 'var(--text-primary)',
          }}
        >
          Repair recommendations
        </h1>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '13.5px',
            color: 'var(--text-secondary)',
          }}
        >
          Keep track of mechanic suggestions, parts, and repair progress.
        </p>
      </div>

      {error && !modalOpen && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
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
            {vehicle && (
              <div
                style={{
                  marginLeft: 'auto',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                }}
              >
                {vehicle.make} {vehicle.model}
              </div>
            )}
          </div>

          <section className="card">
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Recommended repairs
            </h2>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
              }}
            >
              Parts suggested by a mechanic and their purchase and mounting
              status.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openAdd}
          >
            <Plus size={14} /> Add recommendation
          </button>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '28px',
              color: 'var(--text-tertiary)',
            }}
          >
            <LoaderCircle size={18} className="spinner" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="empty-state" style={{ padding: '34px 20px' }}>
            <Wrench size={24} color="var(--text-tertiary)" />
            <p
              style={{
                margin: '9px 0 0',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              No recommended repairs yet.
            </p>
          </div>
        ) : (
          recommendations.map((recommendation, index) => (
            <div
              key={recommendation.id}
              style={{
                padding: '14px 20px',
                borderBottom:
                  index < recommendations.length - 1
                    ? '1px solid var(--border-subtle)'
                    : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {recommendation.partName}
                </div>
                <div
                  style={{
                    marginTop: '4px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span>{recommendation.mechanicName}</span>
                  <span>·</span>
                  <span>{formatDate(recommendation.recommendedAt)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '10px',
                  }}
                >
                  {(
                    [
                      ['isBought', 'Bought', ShoppingBag],
                      ['isMounted', 'Mounted', Check],
                    ] as const
                  ).map(([field, label, Icon]) => {
                    const active = recommendation[field];
                    return (
                      <button
                        key={field}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        aria-pressed={active}
                        disabled={savingStatusId === recommendation.id}
                        onClick={() =>
                          void toggleStatus(recommendation, field)
                        }
                        style={{
                          color: active
                            ? 'var(--accent)'
                            : 'var(--text-secondary)',
                          borderColor: active
                            ? 'var(--accent)'
                            : 'var(--border-subtle)',
                        }}
                      >
                        <Icon size={13} />
                        {label}: {active ? 'Yes' : 'No'}
                      </button>
                    );
                  })}
                  {savingStatusId === recommendation.id && (
                    <LoaderCircle
                      size={14}
                      className="spinner"
                      style={{ alignSelf: 'center' }}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '6px' }}
                  aria-label={`Edit ${recommendation.partName}`}
                  onClick={() => openEdit(recommendation)}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '6px', color: 'var(--red)' }}
                  aria-label={`Delete ${recommendation.partName}`}
                  onClick={() => void handleDelete(recommendation)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
          </section>

      <AnimatePresence>
        {modalOpen && (
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
            <m.div
              className="modal"
              style={{ maxWidth: '500px' }}
              variants={modalVariants}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
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
                    {editing ? 'Edit recommendation' : 'Recommend a repair'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '6px' }}
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <form
                onSubmit={(event) => void handleSubmit(event)}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div>
                  <label className="field-label" htmlFor="repair-part-name">
                    Part name
                  </label>
                  <FieldInput
                    id="repair-part-name"
                    required
                    maxLength={150}
                    placeholder="e.g. Front brake pads"
                    value={form.partName}
                    onChange={(event) =>
                      setForm({ ...form, partName: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="repair-mechanic">
                    Recommended by
                  </label>
                  <FieldInput
                    id="repair-mechanic"
                    required
                    maxLength={150}
                    placeholder="Mechanic or garage"
                    value={form.mechanicName}
                    onChange={(event) =>
                      setForm({ ...form, mechanicName: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="field-label">Date of recommendation</label>
                  <FieldDate
                    value={form.recommendedAt}
                    onChange={(recommendedAt) =>
                      setForm({ ...form, recommendedAt })
                    }
                  />
                </div>
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.isBought}
                      onChange={(event) =>
                        setForm({ ...form, isBought: event.target.checked })
                      }
                    />
                    Bought
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.isMounted}
                      onChange={(event) =>
                        setForm({ ...form, isMounted: event.target.checked })
                      }
                    />
                    Changed / mounted
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={saving}
                  >
                    {saving && <LoaderCircle size={14} className="spinner" />}
                    {saving
                      ? 'Saving…'
                      : editing
                        ? 'Save changes'
                        : 'Add recommendation'}
                  </button>
                </div>
              </form>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
