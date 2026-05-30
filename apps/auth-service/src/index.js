require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

// Railway inyectará 'PORT'. Si no existe (local), usa 'AUTH_PORT' o el 3001 por defecto.
const port = process.env.PORT || process.env.AUTH_PORT || 3001;

app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://44.223.2.142:5173", // <-- Tu IP pública de AWS
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Bloqueado por CORS en Auth"));
    }
  },
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: true,
    message: "Demasiados intentos de login. Intente mas tarde.",
  },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    error: true,
    message: "Demasiadas peticiones, intente mas tarde.",
  },
});

app.use(express.json({ limit: "10kb" }));
app.use("/api/auth/login", loginLimiter);
app.use("/api/", apiLimiter);
app.use("/api", authRoutes);
app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`[AUTH-SECURITY-ON] Auth service corriendo en puerto ${port}`);
});
