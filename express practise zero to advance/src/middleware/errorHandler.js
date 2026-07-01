const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[${statusCode}] ${err.message}`);

  res.status(statusCode).json({
    success: false,
    status: err.status || 'error',
    message: err.isOperational ? err.message : 'Something went wrong',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
