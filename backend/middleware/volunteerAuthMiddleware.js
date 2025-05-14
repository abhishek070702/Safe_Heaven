import jwt from 'jsonwebtoken';
import Volunteer from '../models/volunteerModel.js';
import dotenv from 'dotenv';

dotenv.config();

const protectVolunteer = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '1e2eebdd6f3ff3f8090536ab2f46df5a2d91dedc39b21e2c4ad2b979377a68b5');

      // Get volunteer from the token
      req.volunteer = await Volunteer.findById(decoded.id).select('-password');

      // Check if volunteer exists and isn't blocked
      if (!req.volunteer) {
        res.status(404);
        throw new Error('Volunteer not found');
      }
      
      if (req.volunteer.isBlocked) {
        res.status(403);
        throw new Error('Your account has been blocked. Please contact admin.');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

export { protectVolunteer }; 