import express from 'express';
import { 
  registerDonor, 
  loginDonor, 
  getDonorProfile,
  updateDonorProfile,
  deleteDonorAccount,
  // getDonorDashboard // Removed
} from '../controllers/donorController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import Donor from '../models/donorModel.js';

const router = express.Router();

// Register donor with file upload
router.post('/register', upload.single('profilePhoto'), registerDonor);

// Login route
router.post('/login', loginDonor);

// Protected profile routes
router.route('/profile')
  .get(protect, getDonorProfile)
  .put(protect, upload.single('profilePhoto'), updateDonorProfile)
  .delete(protect, deleteDonorAccount);

// Removed dashboard route
// router.get('/dashboard', protect, getDonorDashboard);

// Check if username is available
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  const exists = await Donor.findOne({ username });
  res.json({ available: !exists });
});

// Check if email is available
router.get('/check-email/:email', async (req, res) => {
  const { email } = req.params;
  const exists = await Donor.findOne({ email });
  res.json({ available: !exists });
});

// Add new donor routes here

export default router; 