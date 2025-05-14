import express from 'express';
import { 
  registerElderHomeOwner, 
  loginElderHomeOwner, 
  getElderHomeOwnerProfile, 
  updateElderHomeOwnerProfile,
  deleteElderHomeOwnerAccount,
  getElderHomeOwnerDashboard,
  checkElderHomeName
} from '../controllers/elderHomeOwnerController.js';
import { protectElderHomeOwner, protectApprovedElderHomeOwner } from '../middleware/elderHomeAuthMiddleware.js';
import elderHomeUpload from '../middleware/elderHomeUploadMiddleware.js';
import ElderHomeOwner from '../models/elderHomeOwnerModel.js';
import Donation from '../models/donationModel.js';
import Patient from '../models/patientModel.js';
import mongoose from 'mongoose';

const router = express.Router();

// Upload fields for registration
const uploadFields = elderHomeUpload.fields([
  { name: 'licenseDocument', maxCount: 1 },
  { name: 'homePhotos', maxCount: 5 }
]);

// Register elder home owner route - simplified
// Apply middleware directly. Any errors will be caught by the global errorHandler.
router.post('/register', uploadFields, registerElderHomeOwner);

// Login route
router.post('/login', loginElderHomeOwner);

// Status-checking route - accessible to any authenticated elder home owner
router.get('/dashboard', protectElderHomeOwner, getElderHomeOwnerDashboard);

// Protected routes - accessible only to approved elder home owners
router.route('/profile')
  .get(protectApprovedElderHomeOwner, getElderHomeOwnerProfile)
  .put(protectApprovedElderHomeOwner, uploadFields, updateElderHomeOwnerProfile)
  .delete(protectApprovedElderHomeOwner, deleteElderHomeOwnerAccount);

// Public route to get all approved elder homes
router.get('/', async (req, res) => {
  try {
    const homes = await ElderHomeOwner.find({ approvalStatus: 'approved' }).select('-password -__v');
    res.json(homes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch elder homes.' });
  }
});

// Get donation summary for an elder home
router.get('/:id/donations/summary', async (req, res) => {
  try {
    const total = await Donation.aggregate([
      { $match: { elderHome: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: null, total: { $sum: '$amountLKR' } } }
    ]);
    res.json({ total: total[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch donation summary.' });
  }
});

// Get patient count for an elder home
router.get('/:id/patients/count', async (req, res) => {
  try {
    const count = await Patient.countDocuments({ elderHomeId: req.params.id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch patient count.' });
  }
});

// Public route to get a single elder home by ID
router.get('/:id', async (req, res) => {
  try {
    const home = await ElderHomeOwner.findById(req.params.id).select('-password -__v');
    if (!home) {
      return res.status(404).json({ message: 'Elder home not found' });
    }
    res.json(home);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch elder home.' });
  }
});

// Get all donations for a specific elder home (for dashboard, no donor info)
router.get('/:id/donations', async (req, res) => {
  try {
    const donations = await Donation.find({ elderHome: req.params.id })
      .sort('-createdAt')
      .select('amount amountLKR currency description createdAt status');
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch donations.' });
  }
});

// Add this route for frontend uniqueness check
router.get('/check-name/:name', checkElderHomeName);

export default router; 