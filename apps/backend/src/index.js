const express = require("express");
const app = express();
// Usamos la variable de entorno que definimos en el docker-compose
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "EnergyGrid Backend" });
});

// CRUCIAL: Añadir "0.0.0.0" para que Docker pueda redirigir el tráfico
app.listen(port, "0.0.0.0", () => {
  console.log(`Backend listening at http://0.0.0.0:${port}`);
});
