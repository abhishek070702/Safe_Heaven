import express from 'express';
import Donation from '../models/donationModel.js';

const router = express.Router();

// Create a new donation
router.post('/', async (req, res) => {
  try {
    const { elderHomeId, donorId, donorType, amount, currency, description } = req.body;
    if (!elderHomeId || !donorId || !donorType || !amount || !currency) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Currency conversion rates (update as needed)
    const rates = { USD: 300, INR: 4, LKR: 1 };
    const amountLKR = currency === 'LKR' ? Number(amount) : Number(amount) * (rates[currency] || 1);
    const donation = new Donation({
      elderHome: elderHomeId,
      donor: donorId,
      donorType,
      amount,
      amountLKR,
      currency,
      description,
      donationType: 'money',
      status: 'completed'
    });
    await donation.save();
    res.status(201).json(donation);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create donation.' });
  }
});

// Universal endpoint to get donations by user ID and donorType
router.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { donorType } = req.query;
  try {
    if (!donorType) {
      return res.status(400).json({ message: 'Missing donorType in query.' });
    }
    const donations = await Donation.find({ donor: id, donorType })
      .populate({ path: 'elderHome', select: 'name elderHomeName' })
      .sort('-createdAt');
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch donations.' });
  }
});

// PATCH endpoint to update donation description
router.patch('/:id', async (req, res) => {
  try {
    const { description } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    donation.description = description;
    await donation.save();
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update donation.' });
  }
});

export default router; 