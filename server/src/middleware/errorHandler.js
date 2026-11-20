export function errorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Multer errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the maximum allowed size (10MB)';
    }
    return res.status(400).json({
      error: {
        code: 'UPLOAD_LIMIT_EXCEEDED',
        message,
        details: [err.message],
      },
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database validation failed',
        details,
      },
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `A resource with the specified ${fields.join(', ')} already exists`,
        details: fields,
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal error occurred',
      details: err.details || [],
    },
  };

  if (isDevelopment && statusCode === 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
