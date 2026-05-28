import React from "react";
import { Terminal, ShieldAlert, Cpu, CheckCircle } from "lucide-react";

const AutomatedInsights = ({ filteredRows, anomalies, activeFilters }) => {
  // 1. Calcular métricas internas sobre los datos filtrados actualmente
  const totalRows = filteredRows.length;
  const criticalRows = filteredRows.filter(r => r.status === "CRITICAL");
  const warningRows = filteredRows.filter(r => r.status === "WARNING");
  
  // 2. Determinar la indicación automática predominante
  let insight = {
    type: "SUCCESS",
    title: "Operación de Red Estable",
    message: "El flujo eléctrico se encuentra dentro de los parámetros nominales de operación. No se requieren acciones de balanceo en este sector.",
    icon: <CheckCircle className="text-emerald-400" size={18} />,
    bgColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
  };

  if (anomalies.sqlInjections.length > 0) {
    insight = {
      type: "SECURITY",
      title: "Alerta de Seguridad Sanitarizada (WAF/Gateway)",
      message: `Se detectaron ${anomalies.sqlInjections.length} payloads maliciosos de SQL Injection en el origen de datos. Los logs estructurados JSON han registrado las trazas IP simuladas para auditoría.`,
      icon: <Terminal className="text-purple-400" size={18} />,
      bgColor: "bg-purple-500/10 border-purple-500/20 text-purple-300"
    };
  } else if (criticalRows.length > 0) {
    const substations = criticalRows.map(r => r.substationId).slice(0, 3).join(", ");
    insight = {
      type: "CRITICAL",
      title: "Sobrecarga Crítica Detectada (>95% Capacidad)",
      message: `Riesgo inminente de apagón cascada en subestación(es): [${substations}]. Acción sugerida backend: Desviar excedente de carga activa hacia líneas de respaldo inmediatas libres.`,
      icon: <ShieldAlert className="text-grid-danger" size={18} />,
      bgColor: "bg-grid-danger/10 border-grid-danger/20 text-grid-danger"
    };
  } else if (activeFilters.isTimeFilter) {
    insight = {
      type: "INFRASTRUCTURE",
      title: "Monitoreo de Demanda Programada (Escalabilidad)",
      message: "Análisis de tráfico de telemetría intensiva en curso. Si nota degradación en el procesamiento de eventos, ejecute 'docker compose up --scale procesamiento=2 -d' en su terminal Docker Desktop.",
      icon: <Cpu className="text-grid-cyan" size={18} />,
      bgColor: "bg-grid-blue/10 border-grid-blue/20 text-grid-cyan"
    };
  } else if (warningRows.length > 0) {
    insight = {
      type: "WARNING",
      title: "Pico de Consumo en Alerta (>80% Capacidad)",
      message: `Existen ${warningRows.length} nodos operando en rango preventivo amarillo. Mantener observación preventiva sobre los voltajes asociados.`,
      icon: <ShieldAlert className="text-yellow-400" size={18} />,
      bgColor: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300"
    };
  }

  return (
    <div className={`border rounded-2xl p-4 transition-all duration-300 mb-6 ${insight.bgColor}`}>
      <div className="flex items-center gap-2.5 font-bold text-sm tracking-wide uppercase">
        {insight.icon}
        <span>{insight.title}</span>
      </div>
      <p className="text-xs mt-2 leading-relaxed opacity-90 font-sans">
        {insight.message}
      </p>
      <div className="text-[10px] font-mono-tech mt-3 opacity-60 flex gap-4">
        <span>Filtro Actual: {activeFilters.summary}</span>
        <span>Muestra analizada: {totalRows} nodos</span>
      </div>
    </div>
  );
};

export default AutomatedInsights;