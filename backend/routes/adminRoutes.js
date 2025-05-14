import express from 'express';
import {
  loginAdmin,
  getAllDonors,
  getDonorById,
  toggleBlockDonor,
  getAllElderHomeOwners,
  getPendingElderHomeOwners,
  getElderHomeOwnerById,
  toggleBlockElderHomeOwner,
  approveElderHomeOwner,
  rejectElderHomeOwner,
  getAllVolunteers,
  getVolunteerById,
  toggleBlockVolunteer,
  getAdminDashboard,
  getAllDonations
} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Simple status check route
router.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Admin API is running',
    timestamp: new Date().toISOString()
  });
});

// Admin login
router.post('/login', loginAdmin);

// Admin dashboard
router.get('/dashboard', getAdminDashboard);

// Donor management routes
router.get('/donors', protectAdmin, getAllDonors);
router.get('/donors/:id', protectAdmin, getDonorById);
router.put('/donors/:id/block', protectAdmin, toggleBlockDonor);

// Elder home owner management routes
router.get('/elder-homes', protectAdmin, getAllElderHomeOwners);
router.get('/elder-homes/pending', protectAdmin, getPendingElderHomeOwners);
router.get('/elder-homes/:id', protectAdmin, getElderHomeOwnerById);
router.put('/elder-homes/:id/approve', protectAdmin, approveElderHomeOwner);
router.put('/elder-homes/:id/reject', protectAdmin, rejectElderHomeOwner);
router.put('/elder-homes/:id/block', protectAdmin, toggleBlockElderHomeOwner);

// Volunteer management routes
router.get('/volunteers', protectAdmin, getAllVolunteers);
router.get('/volunteers/:id', protectAdmin, getVolunteerById);
router.put('/volunteers/:id/block', protectAdmin, toggleBlockVolunteer);

// Donation management routes
router.get('/donations', protectAdmin, getAllDonations);

export default router; 