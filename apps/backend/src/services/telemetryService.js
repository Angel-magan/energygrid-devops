const db = require("../config/db");
const districtService = require("./districtService");

const formatKw = (value) =>
  Number.isFinite(value)
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "—";

const saveTelemetry = async (data) => {
  const { district_id, substation_id, consumption_kw, timestamp } = data;
  const query = `
    INSERT INTO telemetry (district_id, substation_id, consumption_kw, timestamp)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [district_id, substation_id, consumption_kw, timestamp];
  const result = await db.query(query, values);
  return result.rows[0];
};

//Obtener los datos de telemetría para un distrito específico
const getLatestTelemetry = async (limit = 50) => {
  const query = `
    SELECT id, district_id, substation_id, consumption_kw, timestamp 
    FROM telemetry 
    ORDER BY timestamp DESC 
    LIMIT $1;
  `;
  const result = await db.query(query, [limit]);
  return result.rows;
};

// Obtener todos los registros de telemetría (sin límite)
const getAllTelemetry = async () => {
  const query = `
    SELECT
      t.id,
      t.district_id,
      d.name AS district_name,
      t.substation_id,
      t.consumption_kw,
      t.timestamp,
      d.capacity_max_kw AS district_capacity_kw
    FROM telemetry t
    LEFT JOIN districts d ON d.id = t.district_id
    ORDER BY timestamp DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};

// Obtener registros de telemetría paginados con metadatos de control
const getAllTelemetryPaginated = async (page, limit) => {
  // 1. Calculamos el desplazamiento (OFFSET)
  const offset = (page - 1) * limit;

  // 2. Consulta de Datos: Agregamos LIMIT y OFFSET parametrizados ($1 y $2)
  const dataQuery = `
    SELECT
      t.id,
      t.district_id,
      d.name AS district_name,
      t.substation_id,
      t.consumption_kw,
      t.timestamp,
      d.capacity_max_kw AS district_capacity_kw
    FROM telemetry t
    LEFT JOIN districts d ON d.id = t.district_id
    ORDER BY timestamp DESC
    LIMIT $1 OFFSET $2;
  `;

  // 3. Consulta de Conteo: Contamos el total de filas en la tabla para la paginación
  const countQuery = `
    SELECT COUNT(*) FROM telemetry;
  `;

  // Ejecutamos ambas consultas a la base de datos
  const dataResult = await db.query(dataQuery, [limit, offset]);
  const countResult = await db.query(countQuery);

  // Parseamos el total de ítems a número entero
  const totalItems = parseInt(countResult.rows[0].count, 10);

  // Calculamos el total de páginas redondeando hacia arriba
  const totalPages = Math.ceil(totalItems / limit);

  // Devolvemos el objeto estructurado idéntico a lo que espera tu nuevo controlador
  return {
    data: dataResult.rows,
    totalItems,
    totalPages,
  };
};

// Recuerda exportar el nuevo método al final del archivo si manejas module.exports
module.exports = {
  getAllTelemetry, // Por si lo usa otro script
  getAllTelemetryPaginated, // El nuevo método de control
};

const buildPeakReason = ({ row, averageKw, direction }) => {
  const valueKw = Number(row.consumption_kw);
  const capacityKw = Number(row.district_capacity_kw);
  const districtName = row.district_name || row.district_id || "distrito";
  const usagePct =
    Number.isFinite(capacityKw) && capacityKw > 0
      ? (valueKw / capacityKw) * 100
      : NaN;
  const deltaKw =
    direction === "highest" ? valueKw - averageKw : averageKw - valueKw;
  const deltaPct =
    Number.isFinite(averageKw) && averageKw > 0
      ? (Math.abs(deltaKw) / averageKw) * 100
      : NaN;

  const reasons = [];
  const causes = [];
  let recommendation = "";

  reasons.push(
    direction === "highest"
      ? `Es el mayor consumo del histórico analizado: ${formatKw(valueKw)} kW.`
      : `Es el menor consumo del histórico analizado: ${formatKw(valueKw)} kW.`,
  );

  if (Number.isFinite(averageKw) && averageKw > 0) {
    reasons.push(
      direction === "highest"
        ? `Supera el promedio general (${formatKw(averageKw)} kW) por ${formatKw(deltaKw)} kW (${formatKw(deltaPct)}%).`
        : `Está por debajo del promedio general (${formatKw(averageKw)} kW) en ${formatKw(deltaKw)} kW (${formatKw(deltaPct)}%).`,
    );
  }

  if (Number.isFinite(usagePct)) {
    reasons.push(
      `En ${districtName} representa el ${formatKw(usagePct)}% de su capacidad máxima (${formatKw(capacityKw)} kW).`,
    );
  }

  if (direction === "highest") {
    causes.push("Posible sobrecarga por uso intensivo de la red en esta zona.");

    if (Number.isFinite(usagePct) && usagePct >= 95) {
      causes.push(
        "Posibles nuevas conexiones, urbanización reciente o ampliación de carga.",
      );
    }

    if (Number.isFinite(deltaPct) && deltaPct >= 25) {
      causes.push(
        "Revisar si hay fugas de electricidad, equipos dañados o consumos anómalos.",
      );
    }

    if (Number.isFinite(deltaPct) && deltaPct >= 15) {
      causes.push(
        "El clima extremo o el uso simultáneo de equipos de alto consumo podría estar elevando la carga.",
      );
    }

    recommendation =
      "Recomendar inspección en campo, revisar medición, transformador y cableado, y vigilar la zona por posibles nuevas cargas.";
  } else {
    causes.push(
      "Caída inusual de consumo que puede indicar desconexión, baja demanda o falla operativa.",
    );

    if (Number.isFinite(usagePct) && usagePct <= 20) {
      causes.push(
        "Verificar posible robo de energía, medidor detenido o cortes parciales en el sector.",
      );
    }

    if (Number.isFinite(deltaPct) && deltaPct >= 25) {
      causes.push(
        "Puede existir un equipo principal apagado, una interrupción local o una reducción fuerte de actividad.",
      );
    }

    causes.push(
      "También conviene revisar si la zona quedó sin carga por obras, mantenimiento o cambios en el horario de uso.",
    );
    recommendation =
      "Recomendar visita técnica y verificar medidores, alimentación y continuidad del servicio en la zona.";
  }

  return { reasons, causes, recommendation };
};

const getTelemetryPeaks = async () => {
  const [telemetryRows, districts] = await Promise.all([
    db.query(`
      SELECT
        t.id,
        t.district_id,
        d.name AS district_name,
        t.substation_id,
        t.consumption_kw,
        t.timestamp,
        d.capacity_max_kw AS district_capacity_kw
      FROM telemetry t
      LEFT JOIN districts d ON d.id = t.district_id
      ORDER BY t.timestamp ASC;
    `),
    districtService.getAllDistricts(),
  ]);

  const rows = telemetryRows.rows.filter((row) =>
    Number.isFinite(Number(row.consumption_kw)),
  );

  if (!rows.length) {
    return {
      generatedAt: new Date().toISOString(),
      count: 0,
      averageKw: null,
      highest: null,
      lowest: null,
    };
  }

  const averageKw =
    rows.reduce((sum, row) => sum + Number(row.consumption_kw), 0) /
    rows.length;

  const highest = rows.reduce((current, row) => {
    if (!current || Number(row.consumption_kw) > Number(current.consumption_kw))
      return row;
    return current;
  }, null);

  const lowest = rows.reduce((current, row) => {
    if (!current || Number(row.consumption_kw) < Number(current.consumption_kw))
      return row;
    return current;
  }, null);

  const enrichPeak = (row, direction) => ({
    id: row.id,
    districtId: row.district_id,
    districtName: row.district_name,
    substationId: row.substation_id,
    consumptionKw: Number(row.consumption_kw),
    timestamp: row.timestamp,
    districtCapacityKw: Number(row.district_capacity_kw),
    ...buildPeakReason({ row, averageKw, direction }),
  });

  return {
    generatedAt: new Date().toISOString(),
    count: rows.length,
    averageKw,
    highest: enrichPeak(highest, "highest"),
    lowest: enrichPeak(lowest, "lowest"),
    districtsCount: districts.length,
  };
};

module.exports = {
  saveTelemetry,
  getLatestTelemetry,
  getAllTelemetry,
  getTelemetryPeaks,
  getAllTelemetryPaginated,
};
