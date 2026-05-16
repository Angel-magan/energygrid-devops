const errorHandler = (err, req, res, next) => {
  console.error(`[AUTH-ERROR] ${err.stack}`);

  const status = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Error interno en el servicio de autenticacion"
      : err.message;

  res.status(status).json({
    error: true,
    message,
  });
};

module.exports = { errorHandler };
