import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Donor from '../models/donorModel.js';
import Volunteer from '../models/volunteerModel.js';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

const JWT_SECRET_FALLBACK = '1e2eebdd6f3ff3f8090536ab2f46df5a2d91dedc39b21e2c4ad2b979377a68b5';

// Protect donor routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const secret = process.env.JWT_SECRET || JWT_SECRET_FALLBACK;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, secret);

      // Get donor from the token
      req.donor = await Donor.findById(decoded.id).select('-password');

      if (!req.donor) {
        res.status(401);
        throw new Error('Not authorized, donor not found');
      }

      next();
    } catch (error) {
      logger.error('Authentication error:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Protect volunteer routes
export const protectVolunteer = asyncHandler(async (req, res, next) => {
  let token;
  const secret = process.env.JWT_SECRET || JWT_SECRET_FALLBACK;
  logger.debug('--- ProtectVolunteer Middleware ---');

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, secret); 

      // Get volunteer from the token
      req.volunteer = await Volunteer.findById(decoded.id).select('-password');

      if (!req.volunteer) {
        logger.debug('Volunteer not found for decoded ID:', decoded.id);
        res.status(401);
        throw new Error('Not authorized, volunteer not found');
      }

      if (req.volunteer.isBlocked) {
        logger.debug('Volunteer is blocked:', req.volunteer.username);
        res.status(403);
        throw new Error('Your account has been blocked. Please contact an administrator.');
      }
      
      next();
    } catch (error) {
      logger.error('JWT Verification Error:', error.message);
      res.status(401);
      // Send back the actual error message from jwt.verify if possible
      throw new Error(`Not authorized, token failed (${error.name || 'Unknown reason'})`); 
    }
  } else {
     logger.debug('No Authorization header found or incorrect format.');
     // Fall through to the final check
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin authentication middleware and other auth middlewares can be added here 