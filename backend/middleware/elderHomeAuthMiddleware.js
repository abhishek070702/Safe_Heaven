import jwt from 'jsonwebtoken';
import ElderHomeOwner from '../models/elderHomeOwnerModel.js';
import dotenv from 'dotenv';

dotenv.config();

const protectElderHomeOwner = async (req, res, next) => {
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

      // Get elder home owner from the token
      req.elderHomeOwner = await ElderHomeOwner.findById(decoded.id).select('-password');

      // Check if elder home owner exists and isn't blocked
      if (!req.elderHomeOwner) {
        res.status(404);
        throw new Error('Elder home owner not found');
      }
      
      if (req.elderHomeOwner.isBlocked) {
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

// Middleware to check if elder home owner is approved in addition to being authenticated
const protectApprovedElderHomeOwner = async (req, res, next) => {
  try {
    // First run the basic protection
    await protectElderHomeOwner(req, res, async () => {
      // Now check if approved
      if (req.elderHomeOwner.approvalStatus !== 'approved') {
        res.status(403);
        throw new Error('Access denied. Your account is not yet approved.');
      }
      
      next();
    });
  } catch (error) {
    next(error);
  }
};

export { protectElderHomeOwner, protectApprovedElderHomeOwner }; 