const MAX_LOGS = 200;

// Este array almacena temporalmente los logs en esta instancia
let logs = [];

/**
 * Genera un ID único para cada log combinando la estampa de tiempo
 * y un número aleatorio grande.
 */
const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

/**
 * Añade un nuevo log al sistema.
 * Ahora incluye una directiva para no saturar la consola con datos repetitivos.
 */
const appendLog = ({
  level = "INFO",   // Niveles válidos: INFO, WARN, ERROR
  service = "System", 
  message = "",
} = {}) => {
  const entry = {
    id: makeId(),
    ts: Date.now(),
    level,
    service,
    message,
  };

  // 1. Lo guardamos en el buffer en memoria para que el Frontend lo pueda leer
  logs = [entry, ...logs].slice(0, MAX_LOGS);

  // 2. Controlamos qué se imprime en la terminal de Docker para no saturarla:
  // Solo imprimimos INFO si no es una inserción rutinaria, o si es un WARN/ERROR importante.
  if (level === "ERROR") {
    console.error(`[🔴 ERROR] [${service}]: ${message}`);
  } else if (level === "WARN") {
    console.warn(`[🟡 WARNING] [${service}]: ${message}`);
  } else {
    // Para logs normales (INFO), los dejamos pasar a la consola de Docker
    console.log(`[🔵 INFO] [${service}]: ${message}`);
  }

  return entry;
};

/**
 * Obtiene los logs acumulados permitiendo filtrar la cantidad
 */
const getLogs = (limit = 50) => {
  const n = Math.max(1, Math.min(Number(limit) || 50, MAX_LOGS));
  return logs.slice(0, n);
};


module.exports = { appendLog, getLogs };