const districtService = require("../services/districtService");
const { appendLog } = require("../services/logService");

const getDistricts = async (req, res) => {
  try {
    const districts = await districtService.getAllDistricts();
    res.status(200).json(districts);
  } catch (error) {
    appendLog({
      level: "ERROR",
      service: "Districts API",
      message: `Fallo obteniendo distritos: ${error.message}`,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;
    const capacityMaxKw = Number(req.body?.capacity_max_kw);

    if (!districtId || !Number.isFinite(capacityMaxKw) || capacityMaxKw <= 0) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const existing = await districtService.getDistrictById(districtId);
    if (!existing) {
      return res.status(404).json({ error: "District not found" });
    }

    const updated = await districtService.updateDistrictCapacity(
      districtId,
      capacityMaxKw,
    );

    appendLog({
      level: "INFO",
      service: "Districts API",
      message: `Capacidad actualizada para ${updated.name}: ${Number(updated.capacity_max_kw).toFixed(2)} kW`,
    });

    res.status(200).json(updated);
  } catch (error) {
    appendLog({
      level: "ERROR",
      service: "Districts API",
      message: `Fallo actualizando distrito: ${error.message}`,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getDistricts,
  updateDistrict,
};
