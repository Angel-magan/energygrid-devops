const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const telemetryRoutes = require("./routes/telemetryRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);
const port = process.env.PORT || 3000;

// 1. Seguridad de Cabeceras
app.use(helmet());

// 2. CORS Seguro
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 3. Rate Limiting (Protección contra Spam)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5, // Máximo 5 peticiones por minuto por IP
  message: { error: "Demasiadas peticiones, intente más tarde." },
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10kb" })); // Limita el tamaño del payload para evitar ataques de memoria

// Rutas
app.use("/api", telemetryRoutes);

// 4. Manejo Centralizado de Errores (Middleware final)
app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`[SECURITY-ON] Backend protegido corriendo en puerto ${port}`);
});
