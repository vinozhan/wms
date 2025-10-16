const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Always use a numeric status code
  let statusCode = 500;
  let message = 'Server Error';

  // Handle AppError instances
  if (err.statusCode && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
    message = err.message;
  } 
  // Handle mongoose errors
  else if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(val => val.message);
    message = `Invalid input data: ${messages.join('. ')}`;
  } 
  // Handle other errors with message
  else if (err.message) {
    message = err.message;
  }

  // Ensure statusCode is always a number
  statusCode = Number(statusCode) || 500;

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;