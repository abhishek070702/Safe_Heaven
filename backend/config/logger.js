// logger.js - Central configuration for logging
import dotenv from 'dotenv';

dotenv.config();

// Determine if we're in production or not
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isVerboseMode = process.env.VERBOSE_LOGGING === 'true';

// Custom logger that only logs in development and when verbose mode is enabled
const logger = {
  info: (...args) => {
    if ((isDevelopment || !isProduction) && isVerboseMode) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Always log errors, they're important
    console.error(...args);
  },
  debug: (...args) => {
    if ((isDevelopment || !isProduction) && isVerboseMode) {
      console.debug(...args);
    }
  },
  warn: (...args) => {
    if ((isDevelopment || !isProduction) && isVerboseMode) {
      console.warn(...args);
    }
  }
};

export default logger; 