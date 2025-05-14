import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import morgan from 'morgan';
import donorRoutes from './routes/donorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import elderHomeOwnerRoutes from './routes/elderHomeOwnerRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { createDefaultAdmin } from './models/adminModel.js';
import fs from 'fs';
import logger from './config/logger.js';
import multer from 'multer';
import patientRoutes from './routes/patientRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import mongoose from 'mongoose';
import donationRoutes from './routes/donationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

// Configure environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create default admin
createDefaultAdmin();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Set up middleware
app.use(cors());
app.use(express.json());
if (process.env.VERBOSE_LOGGING === 'true') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('[:method :url]', { 
    skip: function (req, res) { 
      return res.statusCode < 400; 
    }
  }));
}

// Set up file paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/licenses'),
  path.join(__dirname, 'uploads/homes'),
  path.join(__dirname, 'uploads/volunteers')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Set up static files directory - Simplified: Serve all from /uploads
logger.info(`Serving static files from: ${path.join(__dirname, 'uploads')}`);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/donors', donorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/elder-homes', elderHomeOwnerRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/feedback', feedbackRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Donor Management API is running...');
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Event model
const eventSchema = new mongoose.Schema({
  elderHomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ElderHome', required: true }
});

// ElderHome model
const elderHomeSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}); 