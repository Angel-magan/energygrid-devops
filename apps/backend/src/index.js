const express = require("express");
const telemetryRoutes = require("./routes/telemetryRoutes");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", telemetryRoutes);

app.get("/health", (req, res) => res.status(200).send("UP"));

app.listen(port, "0.0.0.0", () => {
  console.log(`[SERVER] EnergyGrid Backend running on port ${port}`);
});
