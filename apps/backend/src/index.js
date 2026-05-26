const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const telemetryRoutes = require("./routes/telemetryRoutes");
const systemRoutes = require("./routes/systemRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { appendLog } = require("./services/logService");

const app = express();

// Crucial en Railway para que rate-limit lea la IP real del cliente y no la del proxy de Railway
app.set("trust proxy", 1);

const port = process.env.PORT || 3000;

// 1. Seguridad de Cabeceras
app.use(helmet());

// 2. CORS Seguro para Arquitectura de Microservicios
const allowedOrigins = [
  process.env.FRONTEND_URL, // URL que nos dará Railway para el Front
  "http://localhost:5173", // Para que puedas seguir desarrollando local libremente
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como el Simulador de Python de backend a backend, Postman, o servicios internos)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      callback(
        new Error(
          "Bloqueado por CORS: El origen no está permitido en producción.",
        ),
      );
    }
  },
  optionsSuccessStatus: 200,
  credentials: true, // Por si en el futuro manejas cookies o sesiones compartidas
};
app.use(cors(corsOptions));

// 3. Rate Limiting (Protección contra Spam)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // Máximo 100 peticiones por minuto por IP
  message: { error: "Demasiadas peticiones, intente más tarde." },
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10kb" })); // Evita ataques de denegación de servicio por payloads gigantes

// Rutas
app.use("/api", telemetryRoutes);
app.use("/api", systemRoutes);

// 4. Manejo Centralizado de Errores (Middleware final)
app.use(errorHandler);

// Forzamos escuchar en '0.0.0.0' para que Railway pueda mapear el puerto correctamente hacia el exterior
app.listen(port, "0.0.0.0", () => {
  console.log(`[SECURITY-ON] Backend protegido corriendo en puerto ${port}`);
  appendLog({
    level: "INFO",
    service: "Backend API",
    message: `Servicio iniciado y escuchando en :${port}`,
  });
});
