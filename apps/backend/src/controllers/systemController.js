const dns = require("dns").promises; // <-- Módulo nativo para resolver IPs en la red de Docker
const {
  getSystemMetrics,
  getSystemStatus,
} = require("../services/systemService");
const { getLogs, appendLog } = require("../services/logService");
let chaosConfig = {
  isChaosActive: false,
  scheduledTime: null // Guardará el string de la hora de forma persistente ("HH:MM")
};

// =================================================================
// 2. FUNCIÓN DE DETECCIÓN REAL DE RÉPLICAS EN DOCKER COPOSE
// =================================================================
const countDockerInstances = async () => {
  try {
    // Resolvemos el nombre de servicio que definiste en tu docker-compose.yml
    // Docker DNS retornará un arreglo con las IPs de todas las réplicas activas
    const addresses = await dns.resolve4("eg-backend");
    return addresses.length;
  } catch (error) {
    // Si estás ejecutando el backend suelto sin Docker (npm run dev local),
    // fallará la resolución, por lo que asumimos 1 instancia por defecto.
    return 1;
  }
};

// =================================================================
// 3. ENDPOINT CENTRAL: CONSULTA DE ESTADO DEL SISTEMA
// =================================================================
const getStatus = async (req, res) => {
  try {
    const frontendHealthUrl = process.env.FRONTEND_HEALTH_URL || "http://eg-frontend:5173";

    // 1. Ejecutar las consultas de estado base
    let [status, metrics] = await Promise.all([
      getSystemStatus({ frontendHealthUrl }).catch(() => null),
      getSystemMetrics().catch(() => null)
    ]);

    // Inicializaciones de seguridad contra nulos
    if (!status) {
      status = {
        services: [
          { key: "backend", name: "Backend API", status: "ONLINE" },
          { key: "frontend", name: "Frontend Web", status: "ONLINE" }
        ],
        healthChecks: []
      };
    }
    if (!metrics) {
      metrics = { cpu: 15, ram: 22, apiLatencyMs: 90, eventsPerSec: 5, activeConnections: 4 };
    }

    // 2. DETECCIÓN AUTOMÁTICA REAL DE CONTENEDORES SCALED
    const realActiveContainers = await countDockerInstances();

    // === EVALUACIÓN DINÁMICA DEL CAOS ===
    if (chaosConfig.isChaosActive) {
      // EL SISTEMA CONTINÚA SUFRIENDO EL ATAQUE HASTA QUE EL USUARIO MITIGUE MANUALMENTE
      metrics.cpu = 98;
      metrics.apiLatencyMs = 3800;
      status.scaling = {
        instancesActive: 1,
        loadBalancing: "SATURATED - DB STRESS (Falta escalar)",
        autoscaling: "ALERT_TRIGGERED",
      };

      if (status.services) {
        status.services = status.services.map(s =>
          s.key === 'backend' ? { ...s, status: 'DEGRADED', detail: "Saturación por ráfaga masiva" } : s
        );
      }
    } else {
      // ESTADO NOMINAL (Muestra de forma real cuántos contenedores tienes en tu docker-compose)
      status.scaling = {
        instancesActive: realActiveContainers,
        loadBalancing: realActiveContainers >= 2 ? `ROUND_ROBIN_ACTIVE (${realActiveContainers} Nodos)` : "SINGLE_NODE_MODE",
        autoscaling: "STABLE",
      };
    }

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      services: status.services || [],
      metrics,
      healthChecks: status.healthChecks || [],
      scaling: status.scaling,
      scheduledTime: chaosConfig.scheduledTime,
      logs: getLogs(20),
    });

  } catch (error) {
    console.error("[CRITICAL-FATAL-ERROR]:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const { exec } = require("child_process");
const path = require("path");

const handleChaosEndpoint = async (req, res) => {
  try {
    const { action, scheduledTime } = req.body;

    if (action === "SCHEDULE" && scheduledTime) {
      chaosConfig.scheduledTime = scheduledTime;
      chaosConfig.isChaosActive = false; // Se mantiene en falso hasta que el simulador coincida en el tiempo

      appendLog({
        level: "INFO",
        service: "DevOps-Orchestrator",
        message: `CRON: Alerta de Hora Pico virtual agendada para las ${scheduledTime}. Sincronizando con marcas de tiempo...`,
      });

      return res.status(200).json({ success: true, message: "Caos programado exitosamente", chaosConfig });
    }

    if (action === "START_NOW") {
      chaosConfig.isChaosActive = true;
      chaosConfig.scheduledTime = "Inmediato";

      appendLog({
        level: "WARN",
        service: "DevOps-Orchestrator",
        message: "ALERTA MANUAL: El administrador inició la inyección de estrés. El simulador está atacando la BD.",
      });
      return res.status(200).json({ success: true, chaosConfig });
    }

    if (action === "MITIGATE") {
      appendLog({
        level: "INFO",
        service: "DevOps-Orchestrator",
        message: "Ejecutando auto-escalado: docker-compose up -d --scale eg-backend=3",
      });

      const os = require("os");
      const containerHostname = os.hostname();

      // Consultamos el socket de docker para averiguar las etiquetas de compose en el host
      exec(`docker inspect --format="{{json .Config.Labels}}" ${containerHostname}`, (inspectError, stdoutLabels) => {
        let projectName = "energygrid-devops"; // Fallback por defecto si algo falla
        let hostWorkingDir = "";
        
        if (!inspectError && stdoutLabels) {
          try {
            const labels = JSON.parse(stdoutLabels);
            if (labels) {
              if (labels["com.docker.compose.project"]) {
                projectName = labels["com.docker.compose.project"];
              }
              if (labels["com.docker.compose.project.working_dir"]) {
                hostWorkingDir = labels["com.docker.compose.project.working_dir"];
              }
            }
          } catch (jsonErr) {
            console.error("[ESCALADO]: Error decodificando etiquetas de contenedor:", jsonErr);
          }
        }

        // Si detectamos la carpeta de trabajo del host, definimos las rutas absolutas para que el Daemon de Windows las monte correctamente
        let envVars = "";
        if (hostWorkingDir) {
          const normalizedPath = hostWorkingDir.replace(/\\/g, "/");
          envVars = `BACKEND_VOLUME_PATH="${normalizedPath}/apps/backend" PROJECT_VOLUME_PATH="${normalizedPath}" `;
        }

        // Ejecutamos el comando de escala con las variables de volumen del host, el proyecto correcto, --no-recreate y --no-build
        const scaleCommand = `${envVars}docker compose -p ${projectName} up -d --scale eg-backend=3 --no-recreate --no-build`;
        
        console.log(`[ESCALADO ORQUESTADOR]: Ejecutando -> ${scaleCommand}`);

        exec(scaleCommand, { cwd: "/project" }, (error, stdout, stderr) => {
          if (error) {
            console.error("[ESCALADO ERROR]:", error.message);
            appendLog({
              level: "ERROR",
              service: "DevOps-Orchestrator",
              message: `Fallo al escalar instancias: ${error.message.substring(0, 150)}`
            });
          } else {
            console.log("[ESCALADO ÉXITO]:", stdout);
            appendLog({
              level: "INFO",
              service: "DevOps-Orchestrator",
              message: `Auto-escalado completado con éxito. Réplicas activas creadas en el proyecto: ${projectName}`
            });
          }
        });
      });

      chaosConfig.isChaosActive = false;
      chaosConfig.scheduledTime = null;

      appendLog({
        level: "INFO",
        service: "DevOps-Orchestrator",
        message: "Planificación de contingencia DevOps reestablecida. Carga distribuida.",
      });

      return res.status(200).json({ success: true, chaosConfig });
    }

    // Cancelar Alerta o comando de mitigación manual
    chaosConfig.isChaosActive = false;
    chaosConfig.scheduledTime = null;

    appendLog({
      level: "INFO",
      service: "DevOps-Orchestrator",
      message: "Planificación de contingencia DevOps cancelada.",
    });

    res.status(200).json({ success: true, chaosConfig });
  } catch (error) {
    console.error("[ERROR-CHAOS-ENDPOINT]:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Modificamos el endpoint del simulador para que también le mande el 'scheduledTime' a Python
const getChaosState = async (req, res) => {
  res.status(200).json({
    isChaosActive: chaosConfig.isChaosActive,
    scheduledTime: chaosConfig.scheduledTime
  });
};

module.exports = {
  getStatus,
  handleChaosEndpoint,
  getChaosState,
};