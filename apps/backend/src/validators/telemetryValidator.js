const { body, validationResult } = require("express-validator");

const validateTelemetry = [
  body("district_id")
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .withMessage("ID de distrito inválido o peligroso"),

  body("substation_id").isString().trim().escape().notEmpty(),

  body("consumption_kw")
    .isFloat({ min: 0, max: 100000 })
    .withMessage("El consumo debe ser un número positivo razonable"),

  body("timestamp")
    .isISO8601()
    .toDate()
    .custom((value) => {
      const now = new Date();
      const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000);
      if (value > oneHourAhead) {
        throw new Error("No se aceptan lecturas del futuro");
      }
      return true;
    }),

  // Middleware para capturar los errores de arriba
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn(`[VALIDATION-ERROR] Payload rechazado:`, errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateTelemetry };
