const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  let statusCode = 500;
  let message = 'Server Error';

  // Handle AppError instances
  if (err.statusCode && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
    message = err.message;
  } 
  // Handle mongoose CastError (like invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // Handle mongoose duplicate key
  else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  } 
  // Handle mongoose validation error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(val => val.message);
    message = `Invalid input data: ${messages.join('. ')}`;
  } 
  // Handle JSON parse errors
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
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