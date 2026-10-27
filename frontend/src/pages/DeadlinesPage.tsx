
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  Gauge,
  LoaderCircle,
  Plus,
  Trash2,
  X,
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
import type {
  VehicleDeadline,
  DeadlineType,
  CreateDeadlineData,
} from '../types/deadline';

const DEADLINE_TYPES: {
  value: DeadlineType;
  label: string;
}[] = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'technical_inspection', label: 'Technical inspection' },
  { value: 'road_tax', label: 'Road tax (Vignette)' },
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
  if (!value) return 'Not set';

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatus(deadline: VehicleDeadline) {
  if (deadline.completedAt) {
    return { label: 'Completed', color: 'text-green-700 bg-green-100' };
  }

  if (deadline.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(deadline.dueDate);
    due.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (due.getTime() - today.getTime()) / 86_400_000,
    );

    if (days < 0) {
      return { label: 'Overdue', color: 'text-red-700 bg-red-100' };
    }

    if (days <= 30) {
      return { label: 'Due soon', color: 'text-amber-700 bg-amber-100' };
    }
  }

  return { label: 'Upcoming', color: 'text-cyan-300 bg-blue-100' };
}

function getDaysRemaining(date: string | null) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export default function DeadlinesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [deadlines, setDeadlines] = useState<VehicleDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] =
    useState<VehicleDeadline | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filter, setFilter] = useState<'all' | DeadlineType>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);

      setSelectedVehicleId((current) => {
        if (current && data.some((vehicle) => vehicle.id === current)) {
          return current;
        }

        return data[0]?.id ?? '';
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load vehicles.',
      );
    }
  }, []);

  const loadDeadlines = useCallback(async (vehicleId: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await getDeadlines(vehicleId);
      setDeadlines(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load deadlines.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    if (selectedVehicleId) {
      void loadDeadlines(selectedVehicleId);
    } else {
      setDeadlines([]);
      setLoading(false);
    }
  }, [selectedVehicleId, loadDeadlines]);

  const filteredDeadlines = useMemo(() => {
    return deadlines
      .filter((deadline) => filter === 'all' || deadline.type === filter)
      .filter((deadline) => showCompleted || !deadline.completedAt)
      .sort((a, b) => {
        if (a.completedAt && !b.completedAt) return 1;
        if (!a.completedAt && b.completedAt) return -1;

        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() -
            new Date(b.dueDate).getTime();
        }

        if (a.dueDate) return -1;
        if (b.dueDate) return 1;

        return (a.dueMileage ?? Infinity) - (b.dueMileage ?? Infinity);
      });
  }, [deadlines, filter, showCompleted]);

  const activeDeadlines = deadlines.filter((item) => !item.completedAt);

  const overdueCount = activeDeadlines.filter(
    (item) =>
      item.dueDate && (getDaysRemaining(item.dueDate) ?? 0) < 0,
  ).length;

  const dueSoonCount = activeDeadlines.filter(
    (item) => {
      const days = getDaysRemaining(item.dueDate);
      return days !== null && days >= 0 && days <= 30;
    },
  ).length;

  const totalEstimatedCost = activeDeadlines.reduce(
    (sum, item) => sum + item.amountMillimes,
    0,
  );

  function openCreateModal() {
    setEditingDeadline(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function openEditModal(deadline: VehicleDeadline) {
    setEditingDeadline(deadline);
    setForm({
      type: deadline.type,
      title: deadline.title,
      dueDate: deadline.dueDate
        ? deadline.dueDate.slice(0, 10)
        : '',
      dueMileage: deadline.dueMileage?.toString() ?? '',
      amount: (deadline.amountMillimes / 1000).toString(),
      notes: deadline.notes ?? '',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedVehicleId) {
      setError('Select a vehicle first.');
      return;
    }

    if (!form.dueDate && !form.dueMileage) {
      setError('Enter a due date, a due mileage, or both.');
      return;
    }

    const amount = Number(form.amount || 0);
    const mileage = form.dueMileage
      ? Number(form.dueMileage)
      : undefined;

    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isFinite(amount * 1000)
    ) {
      setError('Enter a valid non-negative amount.');
      return;
    }

    if (
      mileage !== undefined &&
      (!Number.isInteger(mileage) || mileage < 0)
    ) {
      setError('Due mileage must be a non-negative whole number.');
      return;
    }

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
    setSuccess('');

    try {
      if (editingDeadline) {
        await updateDeadline(
          selectedVehicleId,
          editingDeadline.id,
          payload,
        );
        setSuccess('Deadline updated successfully.');
      } else {
        await createDeadline(selectedVehicleId, payload);
        setSuccess('Deadline created successfully.');
      }

      setModalOpen(false);
      await loadDeadlines(selectedVehicleId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save deadline.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(deadline: VehicleDeadline) {
    if (!selectedVehicleId) return;

    const vehicle = vehicles.find(
      (item) => item.id === selectedVehicleId,
    );

    const completedMileage = vehicle?.currentMileage;

    const confirmed = window.confirm(
      `Mark "${deadline.title}" as completed?`,
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await completeDeadline(
        selectedVehicleId,
        deadline.id,
        completedMileage !== undefined ? { completedMileage } : {},
      );

      setSuccess(`"${deadline.title}" marked as completed.`);
      await loadDeadlines(selectedVehicleId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete deadline.',
      );
    }
  }

  async function handleDelete(deadline: VehicleDeadline) {
    if (!selectedVehicleId) return;

    if (!window.confirm(`Delete "${deadline.title}"? This cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteDeadline(selectedVehicleId, deadline.id);
      setDeadlines((current) =>
        current.filter((item) => item.id !== deadline.id),
      );
      setSuccess('Deadline deleted successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete deadline.',
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <CalendarClock size={18} />
              Vehicle management
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Reminders & Deadlines
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Keep track of insurance, technical inspections, road tax, and maintenance.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={!selectedVehicleId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add deadline
          </button>
        </header>

        {error && !modalOpen && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && !modalOpen && (
          <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        {vehicles.length > 0 && (
          <section className="flex flex-col gap-2 sm:max-w-sm">
            <label
              htmlFor="deadline-vehicle"
              className="text-sm font-medium text-slate-300"
            >
              Select vehicle
            </label>
            <select
              id="deadline-vehicle"
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </option>
              ))}
            </select>
          </section>
        )}

        {!loading && vehicles.length === 0 && (
          <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 px-6 py-12 text-center">
            <CalendarClock className="mx-auto mb-3 text-slate-500" size={36} />
            <h2 className="font-semibold">No vehicles found</h2>
            <p className="mt-1 text-sm text-slate-400">
              Add a vehicle in your Garage before creating deadlines.
            </p>
          </section>
        )}

        {selectedVehicleId && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Active deadlines"
                value={String(activeDeadlines.length)}
                description="Items to keep track of"
                icon={<Clock size={20} />}
              />
              <SummaryCard
                title="Overdue"
                value={String(overdueCount)}
                description="Past their due date"
                icon={<AlertTriangle size={20} />}
                alert={overdueCount > 0}
              />
              <SummaryCard
                title="Due in 30 days"
                value={String(dueSoonCount)}
                description="Based on due dates"
                icon={<CalendarClock size={20} />}
              />
              <SummaryCard
                title="Estimated costs"
                value={formatMoney(totalEstimatedCost)}
                description="For active deadlines"
                icon={<Gauge size={20} />}
              />
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Your deadlines</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {filteredDeadlines.length} record
                    {filteredDeadlines.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    aria-label="Filter by deadline type"
                    value={filter}
                    onChange={(event) =>
                      setFilter(event.target.value as 'all' | DeadlineType)
                    }
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  >
                    <option value="all">All categories</option>
                    {DEADLINE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(event) =>
                        setShowCompleted(event.target.checked)
                      }
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    Show completed
                  </label>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
                  <LoaderCircle className="animate-spin" size={20} />
                  Loading deadlines...
                </div>
              ) : filteredDeadlines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 px-5 py-12 text-center">
                  <CalendarClock
                    className="mx-auto mb-3 text-slate-500"
                    size={32}
                  />
                  <h3 className="font-medium">No deadlines to show</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Add a deadline to start tracking important dates and mileage.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-400 text-slate-950 px-3 py-2 text-sm font-medium hover:bg-cyan-300"
                  >
                    <Plus size={16} />
                    Add your first deadline
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredDeadlines.map((deadline) => {
                    const status = getStatus(deadline);
                    const daysRemaining = getDaysRemaining(deadline.dueDate);
                    const typeLabel =
                      DEADLINE_TYPES.find(
                        (item) => item.value === deadline.type,
                      )?.label ?? deadline.type;

                    return (
                      <article
                        key={deadline.id}
                        className={`rounded-xl border p-4 transition ${
                          deadline.completedAt
                            ? 'border-slate-800 bg-slate-950/70'
                            : 'border-slate-800 bg-slate-900 hover:border-cyan-400/20 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-gray-600">
                                {typeLabel}
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${status.color}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            <h3 className="break-words font-semibold">
                              {deadline.title}
                            </h3>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              title="Edit deadline"
                              aria-label={`Edit ${deadline.title}`}
                              onClick={() => openEditModal(deadline)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-blue-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              title="Delete deadline"
                              aria-label={`Delete ${deadline.title}`}
                              onClick={() => void handleDelete(deadline)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-2 text-sm">
                            <CalendarClock
                              size={17}
                              className="mt-0.5 shrink-0 text-slate-500"
                            />
                            <div>
                              <p className="text-xs text-slate-400">Due date</p>
                              <p className="font-medium">
                                {formatDate(deadline.dueDate)}
                              </p>
                              {!deadline.completedAt &&
                                daysRemaining !== null && (
                                  <p
                                    className={`mt-0.5 text-xs ${
                                      daysRemaining < 0
                                        ? 'text-red-600'
                                        : daysRemaining <= 30
                                          ? 'text-amber-600'
                                          : 'text-slate-400'
                                    }`}
                                  >
                                    {daysRemaining < 0
                                      ? `${Math.abs(daysRemaining)} days overdue`
                                      : daysRemaining === 0
                                        ? 'Due today'
                                        : `${daysRemaining} days remaining`}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="flex items-start gap-2 text-sm">
                            <Gauge
                              size={17}
                              className="mt-0.5 shrink-0 text-slate-500"
                            />
                            <div>
                              <p className="text-xs text-slate-400">Due mileage</p>
                              <p className="font-medium">
                                {deadline.dueMileage !== null
                                  ? `${deadline.dueMileage.toLocaleString()} km`
                                  : 'Not set'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {deadline.amountMillimes > 0 && (
                          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                            <span className="text-sm text-slate-400">
                              Estimated cost
                            </span>
                            <span className="font-semibold">
                              {formatMoney(deadline.amountMillimes)}
                            </span>
                          </div>
                        )}

                        {deadline.notes && (
                          <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-400">
                            {deadline.notes}
                          </p>
                        )}

                        {deadline.completedAt && (
                          <p className="mt-3 text-xs text-green-700">
                            Completed on {formatDate(deadline.completedAt)}
                            {deadline.completedMileage !== null &&
                              ` at ${deadline.completedMileage.toLocaleString()} km`}
                          </p>
                        )}

                        {!deadline.completedAt && (
                          <button
                            type="button"
                            onClick={() => void handleComplete(deadline)}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                          >
                            <Check size={16} />
                            Mark as completed
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="deadline-modal-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-slate-900 p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  id="deadline-modal-title"
                  className="text-xl font-bold"
                >
                  {editingDeadline ? 'Edit deadline' : 'Add deadline'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Enter a due date, mileage, or both.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close form"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="deadline-type"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Category
                </label>
                <select
                  id="deadline-type"
                  required
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value as DeadlineType,
                    })
                  }
                  className="w-full rounded-xl border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                >
                  {DEADLINE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="deadline-title"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Title
                </label>
                <input
                  id="deadline-title"
                  required
                  maxLength={150}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Insurance renewal"
                  className="w-full rounded-xl border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="deadline-date"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Due date
                  </label>
                  <input
                    id="deadline-date"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm({ ...form, dueDate: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deadline-mileage"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Due mileage (km)
                  </label>
                  <input
                    id="deadline-mileage"
                    type="number"
                    min="0"
                    step="1"
                    value={form.dueMileage}
                    onChange={(event) =>
                      setForm({ ...form, dueMileage: event.target.value })
                    }
                    placeholder="e.g. 90000"
                    className="w-full rounded-xl border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="deadline-amount"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Estimated cost (TND)
                </label>
                <input
                  id="deadline-amount"
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  placeholder="0.000"
                  className="w-full rounded-xl border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              <div>
                <label
                  htmlFor="deadline-notes"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="deadline-notes"
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Additional details..."
                  className="w-full resize-y rounded-xl border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-950 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 text-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-300 disabled:opacity-50 text-slate-950"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {editingDeadline ? 'Save changes' : 'Create deadline'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  alert = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{title}</p>
          <p
            className={`mt-2 break-words text-2xl font-bold ${
              alert ? 'text-red-600' : 'text-slate-100'
            }`}
          >
            {value}
          </p>
        </div>
        <div
          className={`rounded-xl p-2.5 ${
            alert
              ? 'bg-red-50 text-red-600'
              : 'bg-cyan-400/10 text-blue-600'
          }`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </article>
  );
}
