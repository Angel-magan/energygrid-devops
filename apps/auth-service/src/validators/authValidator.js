const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: "Datos de autenticacion invalidos",
      details: errors.array(),
    });
  }

  next();
};

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Email invalido"),
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("La contrasena debe tener entre 8 y 128 caracteres"),
  validate,
];

module.exports = {
  loginValidator,
};
