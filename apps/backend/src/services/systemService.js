const os = require("os");
const db = require("../config/db");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const measure = async (fn) => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6;
  return { result, ms };
};

const dbPing = async () => {
  const { ms } = await measure(() => db.query("SELECT 1 as ok"));
  return ms;
};

const getLatestTelemetryTimestamp = async () => {
  const res = await db.query("SELECT MAX(timestamp) AS ts FROM telemetry");
  const ts = res?.rows?.[0]?.ts;
  return ts ? new Date(ts).getTime() : null;
};

const getTelemetryCountSince = async (sinceMs) => {
  if (!Number.isFinite(Number(sinceMs))) return 0;
  const sinceIso = new Date(Number(sinceMs)).toISOString();
  const res = await db.query(
    "SELECT COUNT(*)::int AS cnt FROM telemetry WHERE timestamp >= $1",
    [sinceIso],
  );
  return res?.rows?.[0]?.cnt ?? 0;
};

const getSystemMetrics = async () => {
  const cpuCount = os.cpus()?.length || 1;
  const load1 = os.loadavg?.()[0] ?? 0;
  const cpuPct = clamp((load1 / cpuCount) * 100, 0, 100);

  const total = os.totalmem?.() ?? 0;
  const free = os.freemem?.() ?? 0;
  const ramPct = total > 0 ? clamp(((total - free) / total) * 100, 0, 100) : 0;

  const apiLatencyMs = await dbPing();

  const latestTs = await getLatestTelemetryTimestamp();
  const windowEnd = latestTs ?? Date.now();
  const windowStart = windowEnd - 60_000;
  const eventsLastMin = await getTelemetryCountSince(windowStart);
  const eventsPerSec = Number((eventsLastMin / 60).toFixed(2));

  const activeConnections = db.pool?.totalCount ?? null;

  return {
    cpu: Math.round(cpuPct),
    ram: Math.round(ramPct),
    apiLatencyMs: Math.round(apiLatencyMs),
    eventsPerSec,
    activeConnections,
  };
};

const statusFromLatency = (ms) => {
  if (!Number.isFinite(ms)) return "OFFLINE";
  if (ms >= 250) return "DEGRADED";
  return "ONLINE";
};

const statusFromTelemetryFreshness = (lastTsMs) => {
  if (!Number.isFinite(lastTsMs)) return "OFFLINE";
  const age = Date.now() - lastTsMs;
  if (age <= 20_000) return "ONLINE";
  if (age <= 90_000) return "DEGRADED";
  return "OFFLINE";
};

const probeUrl = async (url, timeoutMs = 1200) => {
  if (!url) return { ok: false, ms: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { ms, result } = await measure(() =>
      fetch(url, { method: "HEAD", signal: controller.signal }),
    );
    return { ok: result?.ok === true, ms };
  } catch {
    return { ok: false, ms: null };
  } finally {
    clearTimeout(timer);
  }
};

const getSystemStatus = async ({ frontendHealthUrl } = {}) => {
  let dbLatency = null;
  try {
    dbLatency = await dbPing();
  } catch {
    dbLatency = null;
  }

  const lastTelemetryTs = await getLatestTelemetryTimestamp();

  const frontendProbe = frontendHealthUrl
    ? await probeUrl(frontendHealthUrl)
    : { ok: true, ms: null };

  const backendStatus = "ONLINE";
  const postgresStatus = statusFromLatency(dbLatency);
  const simulatorStatus = statusFromTelemetryFreshness(lastTelemetryTs);
  const frontendStatus = frontendProbe.ok ? "ONLINE" : "OFFLINE";

  const services = [
    {
      key: "backend",
      name: "Backend API",
      status: backendStatus,
      detail: "API Core",
      endpoint: "/api",
    },
    {
      key: "postgres",
      name: "PostgreSQL",
      status: postgresStatus,
      detail: "Telemetry storage",
      endpoint: "postgres://eg-db:5432",
    },
    {
      key: "simulator",
      name: "Simulator",
      status: simulatorStatus,
      detail: lastTelemetryTs
        ? `Último envío: ${new Date(lastTelemetryTs).toISOString()}`
        : "Sin telemetría",
      endpoint: "/api/telemetry",
    },
    {
      key: "frontend",
      name: "Frontend",
      status: frontendStatus,
      detail: "UI Console",
      endpoint: frontendHealthUrl || "—",
    },
  ];

  const healthChecks = [
    {
      key: "hc-api",
      service: "Backend API",
      endpoint: "/api/telemetry",
      status: backendStatus,
      responseTimeMs: 1,
    },
    {
      key: "hc-db",
      service: "PostgreSQL",
      endpoint: "SELECT 1",
      status: postgresStatus,
      responseTimeMs: dbLatency ? Math.round(dbLatency) : null,
    },
    {
      key: "hc-sim",
      service: "Simulator",
      endpoint: "POST /api/telemetry",
      status: simulatorStatus,
      responseTimeMs: null,
    },
    {
      key: "hc-fe",
      service: "Frontend",
      endpoint: frontendHealthUrl || "—",
      status: frontendStatus,
      responseTimeMs: frontendProbe.ms ? Math.round(frontendProbe.ms) : null,
    },
  ];

  const instancesActive = Number(process.env.INSTANCES_ACTIVE || 1);
  const scaling = {
    instancesActive: Number.isFinite(instancesActive) ? instancesActive : 1,
    loadBalancing: process.env.LOAD_BALANCING || "ROUND_ROBIN",
    autoscaling: process.env.AUTOSCALING || "ENABLED",
  };

  return {
    services,
    healthChecks,
    scaling,
    lastTelemetryTs,
    dbLatencyMs: dbLatency ? Math.round(dbLatency) : null,
  };
};

module.exports = {
  getSystemMetrics,
  getSystemStatus,
};
