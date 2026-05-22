import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, LogIn, Mail, ShieldCheck, Zap } from "lucide-react";
import { login } from "../services/api";

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@energygrid.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = await login({ email, password });
      localStorage.setItem("eg_auth_token", auth.token);
      localStorage.setItem("eg_auth_user", JSON.stringify(auth.user));
      onLogin(auth);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "No se pudo iniciar sesion. Revise credenciales o eg-auth-service.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    setError("");
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-grid-deep text-grid-text flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-center">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 text-grid-cyan font-black tracking-widest text-sm mb-6">
            <Zap size={20} />
            ENERGYGRID
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-tight max-w-xl">
            Centro de Control Eléctrico El Salvador
          </h1>
          <p className="text-grid-dim mt-4 max-w-lg leading-7">
            Acceso protegido con JWT, roles y base de datos separada para
            credenciales administrativas.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
            {["JWT", "RBAC", "PostgreSQL"].map((item) => (
              <div
                key={item}
                className="border border-grid-border bg-grid-panel/70 rounded-lg px-4 py-3 text-sm font-bold text-grid-cyan text-center"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-grid-panel border border-grid-border rounded-xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-black tracking-widest uppercase text-grid-cyan">
                Acceso seguro
              </p>
              <h2 className="text-2xl font-black mt-1">Iniciar sesion</h2>
            </div>
            <div className="w-11 h-11 rounded-lg bg-grid-cyan/10 border border-grid-cyan/20 flex items-center justify-center text-grid-cyan">
              <ShieldCheck size={22} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-grid-dim mb-2">
                Email
              </label>
              <div className="flex items-center gap-3 bg-grid-deep/60 border border-grid-border rounded-lg px-3 py-3 focus-within:border-grid-cyan/60">
                <Mail size={18} className="text-grid-dim" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-grid-text"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-grid-dim mb-2">
                Contrasena
              </label>
              <div className="flex items-center gap-3 bg-grid-deep/60 border border-grid-border rounded-lg px-3 py-3 focus-within:border-grid-cyan/60">
                <Lock size={18} className="text-grid-dim" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-grid-text"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-grid-danger bg-grid-danger/10 border border-grid-danger/30 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-grid-cyan text-grid-deep font-black hover:bg-sky-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <LogIn size={18} />
                {loading ? "Validando..." : "Entrar"}
              </button>

              <button
                type="button"
                onClick={handleGuestAccess}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-lg border border-grid-border bg-grid-deep/60 text-grid-text font-bold hover:bg-grid-blue/10 hover:border-grid-cyan/40 transition-colors"
              >
                <ArrowRight size={18} className="text-grid-cyan" />
                Invitado
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
