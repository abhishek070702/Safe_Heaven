import express from 'express';
import {
  registerVolunteer,
  loginVolunteer,
  getVolunteerProfile,
  updateVolunteerProfile,
  deleteVolunteerProfile,
  getVolunteerDashboard,
  checkVolunteerUsername,
  checkVolunteerEmail,
  submitFeedback
} from '../controllers/volunteerController.js';
import { protectVolunteer } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import Volunteer from '../models/volunteerModel.js';

const router = express.Router();

// Public routes
router.post('/register', upload.single('profilePhoto'), registerVolunteer);
router.post('/login', loginVolunteer);

// Public route to get all volunteers
router.get('/', async (req, res) => {
  try {
    const volunteers = await Volunteer.find();
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch volunteers.' });
  }
});

// Public route to submit feedback
router.post('/:id/feedback', submitFeedback);

// Protected routes
router
  .route('/profile')
  .get(protectVolunteer, getVolunteerProfile)
  .put(protectVolunteer, upload.single('profilePhoto'), updateVolunteerProfile)
  .delete(protectVolunteer, deleteVolunteerProfile);

// Dashboard route
router.get('/dashboard', protectVolunteer, getVolunteerDashboard);

// Add these routes for frontend uniqueness check
router.get('/check-username/:username', checkVolunteerUsername);
router.get('/check-email/:email', checkVolunteerEmail);

export default router; 