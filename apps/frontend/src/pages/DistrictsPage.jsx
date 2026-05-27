import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, PencilLine, Save, Gauge, Search } from "lucide-react";

import MainLayout from "../components/layout/MainLayout";
import { useDistricts } from "../hooks/useDistricts";

const formatKw = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

const DistrictsPage = () => {
  const {
    data: districts,
    loading,
    error,
    saveDistrictCapacity,
  } = useDistricts();
  const [filterText, setFilterText] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const sortedDistricts = useMemo(() => {
    const list = [...(Array.isArray(districts) ? districts : [])];
    if (!filterText) return list;
    const q = String(filterText).toLowerCase().trim();
    return list.filter((d) => {
      return (
        String(d.name || "")
          .toLowerCase()
          .includes(q) ||
        String(d.id || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [districts, filterText]);

  const selectedDistrict = useMemo(
    () =>
      sortedDistricts.find((district) => district.id === selectedDistrictId) ||
      null,
    [sortedDistricts, selectedDistrictId],
  );

  const handleSelect = (district) => {
    setSelectedDistrictId(district.id);
    setCapacityInput(String(district.capacity_max_kw ?? ""));
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedDistrict) return;

    const nextCapacity = Number(capacityInput);
    if (!Number.isFinite(nextCapacity) || nextCapacity <= 0) {
      setMessage({
        type: "error",
        text: "La capacidad debe ser un número mayor a 0.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const updated = await saveDistrictCapacity(
        selectedDistrict.id,
        nextCapacity,
      );
      setSelectedDistrictId(updated.id);
      setCapacityInput(String(updated.capacity_max_kw));
      setMessage({
        type: "success",
        text: `Capacidad actualizada para ${updated.name}.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo guardar la capacidad.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text">
                Distritos
              </h1>
              <p className="text-sm sm:text-base text-grid-dim mt-1">
                Administración de capacidades máximas por distrito
              </p>
            </div>
            <div className="bg-grid-blue/10 px-4 py-2 rounded-lg border border-grid-blue flex items-center gap-2.5 text-xs font-bold text-grid-cyan tracking-wider select-none">
              <Building2 size={16} />
              CONFIGURABLE
            </div>
          </div>
        </header>

        {(error || message) && (
          <div
            className={`mb-6 rounded-2xl p-5 border shadow-2xl ${message?.type === "success" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-grid-panel border-grid-danger/30"}`}
          >
            <div className="flex items-start gap-3">
              <Gauge
                className={
                  message?.type === "success"
                    ? "text-emerald-300"
                    : "text-grid-danger"
                }
                size={18}
              />
              <div>
                <p className="font-bold text-grid-text">
                  {message?.type === "success" ? "Operación exitosa" : "Error"}
                </p>
                <p className="text-sm text-grid-dim mt-1 font-mono-tech">
                  {message?.text || error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <Building2 size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Distritos registrados
              </h2>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <input
                  aria-label="Buscar distrito por nombre o ID"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Buscar por nombre o ID"
                  className="w-full bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-2 text-sm text-grid-text outline-none focus:border-grid-cyan"
                />
                <Search
                  className="absolute right-3 top-2.5 text-grid-dim"
                  size={16}
                />
              </div>
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText("")}
                  className="text-xs text-grid-cyan font-bold px-3 py-2 rounded-lg border border-grid-cyan/30 bg-grid-deep/30"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-grid-border">
              {loading && (
                <div className="text-sm text-grid-dim">
                  Cargando distritos...
                </div>
              )}
              {!loading &&
                sortedDistricts.map((district) => {
                  const isSelected = district.id === selectedDistrictId;
                  return (
                    <button
                      key={district.id}
                      type="button"
                      onClick={() => handleSelect(district)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${isSelected ? "bg-grid-blue/10 border-grid-blue/40 shadow-lg" : "bg-grid-deep/40 border-grid-border/40 hover:bg-grid-blue/5 hover:border-grid-blue/20"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-grid-text">
                            {district.name}
                          </p>
                          <p className="text-xs text-grid-dim font-mono-tech mt-1">
                            ID: {district.id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-widest text-grid-dim">
                            Capacidad actual
                          </p>
                          <p className="text-sm font-mono-tech font-bold text-grid-cyan mt-1">
                            {formatKw(district.capacity_max_kw)} kW
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </section>

          <section className="lg:col-span-5 bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <PencilLine size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Editar capacidad
              </h2>
            </div>

            {selectedDistrict ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest text-grid-dim">
                    Distrito seleccionado
                  </p>
                  <p className="text-lg font-bold text-grid-text mt-1">
                    {selectedDistrict.name}
                  </p>
                  <p className="text-xs font-mono-tech text-grid-dim mt-1">
                    {selectedDistrict.id}
                  </p>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                    Capacidad máxima (kW)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(e.target.value)}
                    className="mt-2 w-full bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-3 text-sm text-grid-text outline-none focus:border-grid-cyan"
                    placeholder="Ej: 5000"
                  />
                </label>

                <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4 text-sm text-grid-dim">
                  Cuando guardes, la telemetría, alertas y mapa usarán este
                  valor para calcular el porcentaje de uso.
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-grid-cyan/10 border border-grid-cyan/40 px-4 py-3 text-sm font-bold text-grid-text hover:bg-grid-cyan/15 transition-colors disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Guardando..." : "Guardar capacidad"}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-grid-border/50 bg-grid-deep/30 p-6 text-sm text-grid-dim">
                Selecciona un distrito de la lista para editar su capacidad
                máxima.
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default DistrictsPage;
