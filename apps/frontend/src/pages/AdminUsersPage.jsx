import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  PencilLine,
  Power,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import MainLayout from "../components/layout/MainLayout";
import {
  createAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
} from "../services/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [panelMode, setPanelMode] = useState("idle");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem("eg_auth_token");

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("eg_auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetchAdminUsers(token);
      const list = Array.isArray(response.users) ? response.users : [];
      setUsers(list);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudieron cargar los administradores.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const list = [...users];
    const query = filterText.trim().toLowerCase();

    if (!query) return list;

    return list.filter((user) => {
      return [user.name, user.email, ...(user.roles || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [users, filterText]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId],
  );

  const beginCreate = () => {
    setSelectedUserId(null);
    setPanelMode("create");
    setForm(emptyForm);
    setMessage(null);
  };

  const beginEdit = (user) => {
    setSelectedUserId(user.id);
    setPanelMode("edit");
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
    });
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      const response = selectedUserId
        ? await updateAdminUser(token, selectedUserId, payload)
        : await createAdminUser(token, {
            ...payload,
            password: form.password,
          });

      const nextUser = response.user;
      await loadUsers();
      setSelectedUserId(nextUser.id);
      setPanelMode("edit");
      setForm({
        name: nextUser.name || "",
        email: nextUser.email || "",
        password: "",
      });
      setMessage({
        type: "success",
        text: selectedUserId
          ? `Administrador ${nextUser.name} actualizado.`
          : `Administrador ${nextUser.name} creado.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el usuario.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await updateAdminUserStatus(
        token,
        user.id,
        !user.is_active,
      );

      const updatedUser = response.user;
      setUsers((current) =>
        current.map((entry) =>
          entry.id === updatedUser.id ? updatedUser : entry,
        ),
      );

      if (selectedUserId === updatedUser.id) {
        setSelectedUserId(updatedUser.id);
        setPanelMode("edit");
        setForm({
          name: updatedUser.name || "",
          email: updatedUser.email || "",
          password: "",
        });
      }

      setMessage({
        type: "success",
        text: updatedUser.is_active
          ? `Administrador ${updatedUser.name} reactivado.`
          : `Administrador ${updatedUser.name} desactivado.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo cambiar el estado del usuario.",
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
                Administradores
              </h1>
              <p className="text-sm sm:text-base text-grid-dim mt-1">
                Alta, edición y desactivación de usuarios administradores
              </p>
            </div>
            <div className="bg-grid-blue/10 px-4 py-2 rounded-lg border border-grid-blue flex items-center gap-2.5 text-xs font-bold text-grid-cyan tracking-wider select-none">
              <ShieldCheck size={16} />
              USUARIOS
            </div>
          </div>
        </header>

        {message && (
          <div
            className={`mb-6 rounded-2xl p-5 border shadow-2xl ${message.type === "success" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-grid-panel border-grid-danger/30"}`}
          >
            <div className="flex items-start gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="text-emerald-300 mt-0.5" size={18} />
              ) : (
                <AlertTriangle className="text-grid-danger mt-0.5" size={18} />
              )}
              <div>
                <p className="font-bold text-grid-text">
                  {message.type === "success" ? "Operación exitosa" : "Error"}
                </p>
                <p className="text-sm text-grid-dim mt-1 font-mono-tech">
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-grid-border/50 pb-4">
              <div className="flex items-center gap-3 w-full">
                <Users size={20} className="text-grid-cyan" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                  Administradores registrados
                </h2>
              </div>
              <div className="w-full sm:w-auto flex justify-start sm:justify-end">
                <button
                  type="button"
                  onClick={beginCreate}
                  aria-label="Crear nuevo administrador"
                  className="inline-flex items-center gap-2 rounded-xl border border-grid-cyan/30 bg-grid-cyan/10 px-3 sm:px-4 py-2 text-xs font-bold tracking-widest text-grid-cyan hover:bg-grid-cyan/15 transition-colors"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">Nuevo admin</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <input
                  aria-label="Buscar administrador por nombre o email"
                  value={filterText}
                  onChange={(event) => setFilterText(event.target.value)}
                  placeholder="Buscar por nombre, email o rol"
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
                  Cargando administradores...
                </div>
              )}

              {!loading && filteredUsers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-grid-border/50 bg-grid-deep/30 p-6 text-sm text-grid-dim">
                  No hay administradores que coincidan con el filtro.
                </div>
              )}

              {!loading &&
                filteredUsers.map((user, index) => {
                  const isSelected = user.id === selectedUserId;
                  return (
                    <motion.button
                      key={user.id}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: index * 0.03 }}
                      onClick={() => beginEdit(user)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${isSelected ? "bg-grid-blue/10 border-grid-blue/40 shadow-lg" : "bg-grid-deep/40 border-grid-border/40 hover:bg-grid-blue/5 hover:border-grid-blue/20"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-grid-text">
                            {user.name}
                          </p>
                          <p className="text-xs text-grid-dim font-mono-tech mt-1">
                            {user.email}
                          </p>
                          <p className="text-[11px] text-grid-dim mt-2">
                            Creado: {formatDate(user.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`text-[11px] font-extrabold tracking-widest px-2.5 py-1 rounded-full border ${user.is_active ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" : "text-grid-danger bg-grid-danger/10 border-grid-danger/30"}`}
                          >
                            {user.is_active ? "ACTIVO" : "INACTIVO"}
                          </span>
                          <span className="text-[11px] text-grid-cyan font-bold uppercase tracking-widest">
                            {(user.roles || []).join(", ")}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 justify-end">
                        <span className="text-[11px] text-grid-dim font-mono-tech">
                          Actualizado: {formatDate(user.updated_at)}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          </section>

          <section className="lg:col-span-5 bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <PencilLine size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                {panelMode === "edit"
                  ? "Editar administrador"
                  : panelMode === "create"
                    ? "Nuevo administrador"
                    : "Selecciona un administrador"}
              </h2>
            </div>

            {panelMode === "idle" ? (
              <div className="rounded-2xl border border-dashed border-grid-border/50 bg-grid-deep/30 p-6 text-sm text-grid-dim">
                Selecciona un administrador de la lista para ver y editar su
                información, o pulsa Nuevo admin para crear uno.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                    Nombre
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-3 text-sm text-grid-text outline-none focus:border-grid-cyan"
                    placeholder="Nombre del administrador"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                    Email
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="mt-2 w-full bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-3 text-sm text-grid-text outline-none focus:border-grid-cyan"
                    placeholder="admin@energygrid.local"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                    Contrasena{" "}
                    {selectedUser ? "(dejar vacio para no cambiar)" : ""}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="mt-2 w-full bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-3 text-sm text-grid-text outline-none focus:border-grid-cyan"
                    placeholder="Nueva contrasena"
                    required={!selectedUser && panelMode !== "edit"}
                  />
                </label>

                <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4 text-sm text-grid-dim">
                  En vez de eliminar, puedes desactivar el usuario y reactivarlo
                  luego desde la misma lista.
                </div>

                {selectedUser && (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedUser)}
                    disabled={
                      saving ||
                      String(selectedUser.id) === String(currentUser?.id)
                    }
                    title={
                      String(selectedUser.id) === String(currentUser?.id)
                        ? "No puedes desactivar tu propia cuenta"
                        : undefined
                    }
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60 ${selectedUser.is_active ? "border-grid-danger/40 bg-grid-danger/10 text-grid-danger hover:bg-grid-danger/15" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"}`}
                  >
                    <Power size={16} />
                    {selectedUser.is_active
                      ? "Desactivar usuario"
                      : "Activar usuario"}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-grid-cyan/10 border border-grid-cyan/40 px-4 py-3 text-sm font-bold text-grid-text hover:bg-grid-cyan/15 transition-colors disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving
                    ? "Guardando..."
                    : selectedUser
                      ? "Guardar cambios"
                      : "Crear administrador"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminUsersPage;
