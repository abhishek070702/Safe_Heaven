import logger from '../config/logger.js'; // Import logger
import multer from 'multer'; // Import multer

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // Log the error details (moved from the removed global handler)
  logger.error('!!! ERROR HANDLER CAUGHT ERROR !!!');
  logger.error('Request URL:', req.originalUrl);
  logger.error('Request Method:', req.method);
  logger.error('Error Name:', err.name);
  logger.error('Error Message:', err.message);
  logger.error('Error Code:', err.code);
  logger.error('Error Stack:', err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Default to 500 if status code is still 200
  let message = err.message || 'Internal Server Error';

  // Specific check for Multer errors (moved from the removed global handler)
  if (err instanceof multer.MulterError) {
    statusCode = 400; // Bad request for file upload issues
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum size allowed is 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field received during upload.';
    } else {
      message = `File Upload Error: ${err.code}`;
    }
  // Check for specific file type errors from checkFileType middleware
  } else if (err.message && err.message.includes('Images Only')) {
     statusCode = 400;
     message = 'Invalid file type: Only images (JPG, JPEG, PNG, GIF) are allowed for home photos.';
  } else if (err.message && err.message.includes('License must be')) {
      statusCode = 400;
      message = 'Invalid file type: License must be a PDF or an image file (JPG, JPEG, PNG).';
  }
  // Add more specific error checks if needed (e.g., validation errors)
  else if (err.name === 'ValidationError') { // Example for Mongoose validation
      statusCode = 400;
      message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  // Send the JSON response (existing logic)
  res.status(statusCode).json({
    message: message, // Use the potentially modified message
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler }; 