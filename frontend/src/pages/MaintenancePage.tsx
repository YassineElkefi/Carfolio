
import { useEffect, useState } from 'react';
import {
  Wrench,
  Plus,
  LoaderCircle,
  Package,
  Car,
  Pencil,
  Trash2
} from 'lucide-react';

import { getVehicles } from '../lib/vehicles';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
updateMaintenanceRecord,
deleteMaintenanceRecord,
} from '../lib/maintenance';

import type { Vehicle } from '../types/vehicle';
import type {
  MaintenanceRecord,
  CreateMaintenanceData,
} from '../types/maintenance';

function formatMoney(millimes: number) {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(millimes / 1000);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-TN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const initialForm = {
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
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [records, setRecords] = useState<MaintenanceRecord[]>([]);
    const [form, setForm] = useState(initialForm);

    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        async function loadVehicles() {
        try {
            const data = await getVehicles();
            setVehicles(data);

            if (data.length > 0) {
            setSelectedVehicleId(data[0].id);
            }
        } catch (err) {
            setError(
            err instanceof Error ? err.message : 'Failed to load vehicles.',
            );
        } finally {
            setLoadingVehicles(false);
        }
        }

        void loadVehicles();
    }, []);

    useEffect(() => {
        if (!selectedVehicleId) {
        setRecords([]);
        return;
        }

        let cancelled = false;

        async function loadRecords() {
        setLoadingRecords(true);
        setError('');

        try {
            const data = await getMaintenanceRecords(selectedVehicleId);

            if (!cancelled) {
            setRecords(data);
            }
        } catch (err) {
            if (!cancelled) {
            setError(
                err instanceof Error
                ? err.message
                : 'Failed to load maintenance records.',
            );
            }
        } finally {
            if (!cancelled) {
            setLoadingRecords(false);
            }
        }
        }

        void loadRecords();

        return () => {
        cancelled = true;
        };
    }, [selectedVehicleId]);

    function updateField(
        field: keyof typeof initialForm,
        value: string,
    ) {
        setForm((previous) => ({ ...previous, [field]: value }));
    }

    function handleEdit(record: MaintenanceRecord) {
        setEditingRecordId(record.id);

        setForm({
            itemName: record.itemName,
            category: record.category ?? '',
            purchaseDate: record.purchaseDate
            ? record.purchaseDate.slice(0, 10)
            : '',
            maintenanceDate: record.maintenanceDate.slice(0, 10),
            mileage: String(record.mileage),
            partCost: String(record.partCostMillimes / 1000),
            laborCost: String(record.laborCostMillimes / 1000),
            mechanicName: record.mechanicName ?? '',
            notes: record.notes ?? '',
        });

        setShowForm(true);
        setError('');
        }

        async function handleDelete(record: MaintenanceRecord) {
        const confirmed = window.confirm(
            `Delete "${record.itemName}" from maintenance history? This action cannot be undone.`,
        );

        if (!confirmed) return;

        setError('');

        try {
            await deleteMaintenanceRecord(selectedVehicleId, record.id);

            setRecords((previous) =>
            previous.filter((item) => item.id !== record.id),
            );
        } catch (err) {
            setError(
            err instanceof Error
                ? err.message
                : 'Failed to delete maintenance record.',
            );
        }
        }
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedVehicleId) {
        setError('Please select a vehicle first.');
        return;
        }

        setSaving(true);
        setError('');

        try {
        const data: CreateMaintenanceData = {
            itemName: form.itemName.trim(),
            mileage: Number(form.mileage),
            ...(form.category && { category: form.category }),
            ...(form.purchaseDate && { purchaseDate: form.purchaseDate }),
            ...(form.maintenanceDate && {
            maintenanceDate: form.maintenanceDate,
            }),
            ...(form.partCost !== '' && {
            partCostMillimes: Math.round(Number(form.partCost) * 1000),
            }),
            ...(form.laborCost !== '' && {
            laborCostMillimes: Math.round(Number(form.laborCost) * 1000),
            }),
            ...(form.mechanicName.trim() && {
            mechanicName: form.mechanicName.trim(),
            }),
            ...(form.notes.trim() && { notes: form.notes.trim() }),
        };

        if (editingRecordId) {
            const updated = await updateMaintenanceRecord(
                selectedVehicleId,
                editingRecordId,
                data,
            );

            setRecords((previous) =>
                previous.map((record) =>
                record.id === updated.id ? updated : record,
                ),
            );
            } else {
            const created = await createMaintenanceRecord(
                selectedVehicleId,
                data,
            );

            setRecords((previous) => [created, ...previous]);
            }

            setForm(initialForm);
            setEditingRecordId(null);
            setShowForm(false);
        } catch (err) {
        setError(
            err instanceof Error
            ? err.message
            : 'Failed to create maintenance record.',
        );
        } finally {
        setSaving(false);
        }
    }

    const selectedVehicle = vehicles.find(
        (vehicle) => vehicle.id === selectedVehicleId,
    );

    const totalSpent = records.reduce(
        (total, record) =>
        total + record.partCostMillimes + record.laborCostMillimes,
        0,
    );
    const filteredRecords = records.filter((record) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
        !query ||
        [
        record.itemName,
        record.mechanicName,
        record.notes,
        record.category,
        ].some((value) => value?.toLowerCase().includes(query));

    const matchesCategory =
        selectedCategory === 'all' ||
        record.category === selectedCategory;
    
    const recordDate = record.maintenanceDate.slice(0, 10);

    const matchesStartDate =
    !startDate || recordDate >= startDate;

    const matchesEndDate =
    !endDate || recordDate <= endDate;

    return (
        matchesSearch &&
        matchesCategory &&
        matchesStartDate &&
        matchesEndDate
        );
    });

    

    return (
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
        <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="flex items-center gap-2 text-cyan-400">
                <Wrench size={18} />
                <span className="text-sm font-semibold tracking-widest">
                    MAINTENANCE
                </span>
                </div>

                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Maintenance & Parts
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                Keep track of replaced parts, servicing, and repair costs.
                </p>
            </div>

            <button
                type="button"
                onClick={() => setShowForm((previous) => !previous)}
                disabled={!selectedVehicleId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Plus size={18} />
                Add maintenance
            </button>
            </div>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <label
                htmlFor="vehicle"
                className="mb-2 block text-sm font-medium text-slate-300"
            >
                Select vehicle
            </label>

            {loadingVehicles ? (
                <p className="text-sm text-slate-400">Loading vehicles...</p>
            ) : vehicles.length === 0 ? (
                <div className="flex items-center gap-3 text-slate-400">
                <Car size={20} />
                <p>No vehicles found. Add a vehicle from your Garage first.</p>
                </div>
            ) : (
                <select
                id="vehicle"
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 sm:max-w-md"
                >
                {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.year}) —{' '}
                    {vehicle.licensePlate}
                    </option>
                ))}
                </select>
            )}
            </section>

            {error && (
            <div
                role="alert"
                className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
                {error}
            </div>
            )}

            {selectedVehicle && (
            <section className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">Selected vehicle</p>
                <p className="mt-2 font-semibold">
                    {selectedVehicle.make} {selectedVehicle.model}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                    {selectedVehicle.currentMileage.toLocaleString()} km
                </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">Maintenance records</p>
                <p className="mt-2 text-2xl font-bold">{records.length}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">Total recorded cost</p>
                <p className="mt-2 text-2xl font-bold text-cyan-300">
                    {formatMoney(totalSpent)}
                </p>
                </div>
            </section>
            )}

            {showForm && selectedVehicle && (
            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                <h2 className="text-xl font-semibold">
                    {editingRecordId ? 'Edit maintenance record' : 'New maintenance record'}
                </h2>

                <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                    <label className="mb-2 block text-sm text-slate-300">
                        Part or service name *
                    </label>
                    <input
                        required
                        maxLength={150}
                        value={form.itemName}
                        onChange={(event) =>
                        updateField('itemName', event.target.value)
                        }
                        placeholder="e.g. Clutch kit"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                    </div>

                    <div>
                    <label className="mb-2 block text-sm text-slate-300">
                        Category
                    </label>
                    <select
                        value={form.category}
                        onChange={(event) =>
                        updateField('category', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    >
                        <option value="">Select category</option>
                        <option value="Engine">Engine</option>
                        <option value="Brakes">Brakes</option>
                        <option value="Clutch & Transmission">
                        Clutch & Transmission
                        </option>
                        <option value="Suspension">Suspension</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Fluids & Filters">Fluids & Filters</option>
                        <option value="Tires">Tires</option>
                        <option value="Bodywork">Bodywork</option>
                        <option value="Other">Other</option>
                    </select>
                    </div>

                    <div>
                    <label className="mb-2 block text-sm text-slate-300">
                        Mileage (km) *
                    </label>
                    <input
                        required
                        type="number"
                        min={selectedVehicle.currentMileage}
                        step={1}
                        value={form.mileage}
                        onChange={(event) =>
                        updateField('mileage', event.target.value)
                        }
                        placeholder={String(selectedVehicle.currentMileage)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                    </div>

                    <div>
                    <label className="mb-2 block text-sm text-slate-300">
                        Purchase date
                    </label>
                    <input
                        type="date"
                        value={form.purchaseDate}
                        onChange={(event) =>
                        updateField('purchaseDate', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                    </div>

                    <div>
                    <label className="mb-2 block text-sm text-slate-300">
                        Maintenance date
                    </label>
                    <input
                        type="date"
                        value={form.maintenanceDate}
                        onChange={(event) =>
                        updateField('maintenanceDate', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                    </div>

                    <div>
                    <label className="mb-2 block text-sm text-slate-300">
                        Mechanic / garage
                    </label>
                    <input
                        maxLength={150}
                        value={form.mechanicName}
                        onChange={(event) =>
                        updateField('mechanicName', event.target.value)
                        }
                        placeholder="Garage name"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                    </div>

                    <div>
                    <label className="mb-2 block text-sm text-slate-300">
                        Part cost (TND)
                    </label>
                    <input
                        type="number"
                        min={0}
                        step="0.001"
                        value={form.partCost}
                        onChange={(event) =>
                        updateField('partCost', event.target.value)
                        }
                        placeholder="0.000"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                    </div>

                    <div>
                    <label className="mb-2 block text-sm text-slate-300">
                        Labor cost (TND)
                    </label>
                    <input
                        type="number"
                        min={0}
                        step="0.001"
                        value={form.laborCost}
                        onChange={(event) =>
                        updateField('laborCost', event.target.value)
                        }
                        placeholder="0.000"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1">
                    <label className="mb-2 block text-sm text-slate-300">
                        Notes
                    </label>
                    <input
                        maxLength={1000}
                        value={form.notes}
                        onChange={(event) =>
                        updateField('notes', event.target.value)
                        }
                        placeholder="Brand, details, observations..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                    >
                    {saving && <LoaderCircle size={16} className="animate-spin" />}
                    {saving
                        ? 'Saving...'
                        : editingRecordId
                            ? 'Save changes'
                            : 'Save record'}
                    </button>

                    <button
                    type="button"
                    onClick={() => {
                        setShowForm(false);
                        setEditingRecordId(null);
                        setForm(initialForm);
                    }}
                    className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800"
                    >
                    Cancel
                    </button>
                </div>
                </form>
            </section>
            )}

            <section className="mt-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Maintenance history</h2>
                {loadingRecords && (
                <LoaderCircle
                    size={18}
                    className="animate-spin text-cyan-400"
                />
                )}
                
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                    <label
                    htmlFor="maintenance-search"
                    className="mb-2 block text-sm text-slate-400"
                    >
                    Search maintenance
                    </label>
                    <input
                    id="maintenance-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search parts, mechanics, notes..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                    />
                </div>

                <div>
                    <label
                    htmlFor="maintenance-category"
                    className="mb-2 block text-sm text-slate-400"
                    >
                    Filter by category
                    </label>
                    <select
                    id="maintenance-category"
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    >
                    <option value="all">All categories</option>
                    {Array.from(
                        new Set(
                        records
                            .map((record) => record.category)
                            .filter((category): category is string => Boolean(category)),
                        ),
                    )
                        .sort()
                        .map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                        ))}
                    </select>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                    <label
                    htmlFor="maintenance-start-date"
                    className="mb-2 block text-sm text-slate-400"
                    >
                    From date
                    </label>
                    <input
                    id="maintenance-start-date"
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
                    />
                </div>

                <div>
                    <label
                    htmlFor="maintenance-end-date"
                    className="mb-2 block text-sm text-slate-400"
                    >
                    To date
                    </label>
                    <input
                    id="maintenance-end-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
                    />
                </div>
                </div>

                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                    Showing {filteredRecords.length} of {records.length} records
                </p>

                {(searchQuery || selectedCategory !== 'all') && (
                    <button
                    type="button"
                    onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setStartDate('');
                        setEndDate('');
                    }}
                    className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                    >
                    Clear filters
                    </button>
                )}
                </div>
            </div>

            {!loadingRecords && records.length === 0 && !error ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-700 px-5 py-12 text-center">
                <Package size={32} className="mx-auto text-slate-500" />
                <h3 className="mt-4 font-semibold">No maintenance records yet</h3>
                <p className="mt-2 text-sm text-slate-400">
                Add a part replacement or service to start your vehicle's
                maintenance history.
                </p>
            </div>
            ) : !loadingRecords && filteredRecords.length === 0 && !error ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center">
                    <h3 className="font-semibold">No matching records</h3>
                    <p className="mt-2 text-sm text-slate-400">
                    Try another search term or category.
                    </p>
                    <button
                    type="button"
                    onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                    }}
                    className="mt-4 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                    >
                    Clear filters
                    </button>
                </div>
                ) :(
                <div className="mt-4 space-y-3">
                {filteredRecords.map((record) => (
                    <article
                    key={record.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
                    >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                        <h3 className="font-semibold">{record.itemName}</h3>

                        <p className="mt-1 text-sm text-slate-400">
                            {record.category || 'General maintenance'} ·{' '}
                            {formatDate(record.maintenanceDate)}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                            {record.mileage.toLocaleString()} km
                            {record.mechanicName
                            ? ` · ${record.mechanicName}`
                            : ''}
                        </p>

                        {record.purchaseDate && (
                            <p className="mt-1 text-xs text-slate-500">
                            Purchased: {formatDate(record.purchaseDate)}
                            </p>
                        )}

                        {record.notes && (
                            <p className="mt-3 text-sm text-slate-300">
                            {record.notes}
                            </p>
                        )}
                        </div>

                        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                        <p className="text-lg font-semibold text-cyan-300">
                            {formatMoney(
                            record.partCostMillimes +
                                record.laborCostMillimes,
                            )}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Parts: {formatMoney(record.partCostMillimes)}
                        </p>
                        <p className="text-xs text-slate-500">
                            Labor: {formatMoney(record.laborCostMillimes)}
                        </p>
                        <button
                            type="button"
                            onClick={() => handleEdit(record)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                            >
                            <Pencil size={15} />
                            Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(record)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:border-red-400 hover:bg-red-500/10"
                                >
                                <Trash2 size={15} />
                                Delete
                            </button>
                        </div>
                    </div>
                    </article>
                ))}
                </div>
            )}
            </section>
        </div>
        </main>
    );
}
