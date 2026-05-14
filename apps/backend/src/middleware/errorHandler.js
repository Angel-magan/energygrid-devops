const errorHandler = (err, req, res, next) => {
  // Logueamos el error real internamente para el desarrollador
  console.error(`[ERROR-INTERNAL] ${err.stack}`);

  // Respondemos al cliente de forma segura
  const status = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Error interno en el servidor de energía"
      : err.message;

  res.status(status).json({
    error: true,
    message: message,
  });
};

module.exports = { errorHandler };
