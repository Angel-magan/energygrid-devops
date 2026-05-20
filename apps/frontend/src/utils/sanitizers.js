// Heurísticas simples para detectar y sanitizar cadenas potencialmente peligrosas
export const isSuspiciousString = (s) => {
  if (typeof s !== "string") return false;
  const normalized = s.toLowerCase();
  const sqlPatterns = [
    "drop table",
    "delete from",
    "insert into",
    "update ",
    "select ",
    "--",
    ";",
    "/*",
    "*/",
    " or ",
    " and ",
  ];
  return sqlPatterns.some((p) => normalized.includes(p));
};

// Devuelve una versión enmascarada simple
export const maskSuspicious = (s) => {
  if (!s && s !== 0) return "—";
  return isSuspiciousString(String(s)) ? "[SUSPICIOSO]" : String(s);
};

// Sanitiza para mostrar en UI general (tablas, recomendaciones) —
// toma la parte antes de patrones SQL y elimina caracteres peligrosos.
export const sanitizeForDisplay = (s) => {
  if (!s && s !== 0) return "(Sin dato)";
  const str = String(s);
  // Si no parece sospechosa, devolver tal cual
  if (!isSuspiciousString(str)) return str;

  // Tomar la parte anterior a tokens típicos de inyección
  const splitRe =
    /(drop\s+table|delete\s+from|insert\s+into|update\s+|select\s+|--|;|\/\*)/i;
  const parts = str.split(splitRe);
  const first = parts[0] || "";
  // Quitar caracteres no alfanuméricos excepto espacios, guiones y underscores
  const cleaned = first.replace(/[^\w\s\-]/g, "").trim();
  return cleaned || "(Sin dato)";
};

export default { isSuspiciousString, maskSuspicious, sanitizeForDisplay };
