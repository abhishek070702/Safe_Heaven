import express from 'express';
import Feedback from '../models/feedbackModel.js';

const router = express.Router();

// Add feedback
router.post('/', async (req, res) => {
  try {
    const { homeType, homeId, rating, comment, user, username } = req.body;
    const feedback = new Feedback({ homeType, homeId, rating, comment, user, username });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ message: 'Failed to add feedback.' });
  }
});

// Get feedback for a home
router.get('/', async (req, res) => {
  try {
    const { homeType, homeId } = req.query;
    const feedbacks = await Feedback.find({ homeType, homeId });
    res.json(feedbacks);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch feedback.' });
  }
});

// Delete feedback by user (for account deletion)
router.delete('/user/:userId', async (req, res) => {
  try {
    await Feedback.deleteMany({ user: req.params.userId });
    res.json({ message: 'Feedback deleted for user.' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete feedback.' });
  }
});

export default router; 