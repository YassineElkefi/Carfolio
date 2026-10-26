
import { useCallback, useEffect, useState } from 'react';
import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from './lib/vehicles';
import type { CreateVehicleData } from './lib/vehicles';
import type { Vehicle } from './types/vehicle';

const initialForm: CreateVehicleData = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  currentMileage: 0,
};

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateVehicleData>(initialForm);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load vehicles.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  function updateField<K extends keyof CreateVehicleData>(
    field: K,
    value: CreateVehicleData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setSubmitting(true);
  setError('');

  try {
    if (editingVehicleId) {
      await updateVehicle(editingVehicleId, form);
    } else {
      await createVehicle(form);
    }

    setForm(initialForm);
    setEditingVehicleId(null);
    await loadVehicles();
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Failed to save vehicle.',
    );
  } finally {
    setSubmitting(false);
  }
}

function handleEdit(vehicle: Vehicle) {
  setEditingVehicleId(vehicle.id);
  setForm({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    licensePlate: vehicle.licensePlate,
    currentMileage: vehicle.currentMileage,
  });
  setError('');
}

function cancelEdit() {
  setEditingVehicleId(null);
  setForm(initialForm);
  setError('');
}

async function handleDelete(vehicle: Vehicle) {
  const confirmed = window.confirm(
    `Are you sure you want to delete your ${vehicle.make} ${vehicle.model}?`,
  );

  if (!confirmed) return;

  setError('');

  try {
    await deleteVehicle(vehicle.id);

    if (editingVehicleId === vehicle.id) {
      cancelEdit();
    }

    await loadVehicles();
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Failed to delete vehicle.',
    );
  }
}


  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
              CARFOLIO
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Your garage
            </h1>
            <p className="mt-2 text-slate-400">
              Everything about your car, in one place.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 sm:block">
            <p className="text-sm text-slate-400">Vehicles</p>
            <p className="mt-1 text-2xl font-semibold">{vehicles.length}</p>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">My vehicles</h2>
              <button
                type="button"
                onClick={() => void loadVehicles()}
                disabled={loading}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
                Loading your vehicles...
              </div>
            ) : vehicles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
                <h3 className="text-lg font-semibold">Your garage is empty</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Add your first vehicle using the form.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {vehicles.map((vehicle) => (
                  <article
                    key={vehicle.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-900"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-cyan-400">
                          {vehicle.make}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold">
                          {vehicle.model}
                        </h3>
                      </div>
                      <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        {vehicle.year}
                      </span>
                    </div>

                    <div className="space-y-3 border-t border-slate-800 pt-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">License plate</span>
                        <span className="font-medium">
                          {vehicle.licensePlate}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Mileage</span>
                        <span className="font-medium">
                          {vehicle.currentMileage.toLocaleString()} km
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-5 flex gap-3 border-t border-slate-800 pt-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(vehicle)}
                        className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium transition hover:bg-slate-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(vehicle)}
                        className="flex-1 rounded-lg border border-red-900/70 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              {editingVehicleId ? 'Edit vehicle' : 'Add a vehicle'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Start tracking your vehicle's history.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="make" className="mb-2 block text-sm text-slate-300">
                  Make
                </label>
                <input
                  id="make"
                  required
                  value={form.make}
                  onChange={(event) => updateField('make', event.target.value)}
                  placeholder="e.g. Citroen"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="model" className="mb-2 block text-sm text-slate-300">
                  Model
                </label>
                <input
                  id="model"
                  required
                  value={form.model}
                  onChange={(event) => updateField('model', event.target.value)}
                  placeholder="e.g. C3"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="year" className="mb-2 block text-sm text-slate-300">
                    Year
                  </label>
                  <input
                    id="year"
                    type="number"
                    required
                    min={1886}
                    max={new Date().getFullYear() + 1}
                    value={form.year}
                    onChange={(event) =>
                      updateField('year', Number(event.target.value))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label htmlFor="mileage" className="mb-2 block text-sm text-slate-300">
                    Mileage (km)
                  </label>
                  <input
                    id="mileage"
                    type="number"
                    required
                    min={0}
                    value={form.currentMileage}
                    onChange={(event) =>
                      updateField('currentMileage', Number(event.target.value))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="plate" className="mb-2 block text-sm text-slate-300">
                  License plate
                </label>
                <input
                  id="plate"
                  required
                  value={form.licensePlate}
                  onChange={(event) =>
                    updateField('licensePlate', event.target.value)
                  }
                  placeholder="e.g. 123 TU 4567"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                { 
                  submitting
                    ? 'Saving...'
                    : editingVehicleId
                      ? 'Save changes'
                      : 'Add vehicle'
                }
              </button>
              {editingVehicleId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full rounded-xl border border-slate-700 px-4 py-3 text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel editing
                </button>
              )}
            </form>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default App;
