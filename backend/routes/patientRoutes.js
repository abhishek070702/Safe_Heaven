import express from 'express';
import Patient from '../models/patientModel.js';

const router = express.Router();

// Donor registers a patient for an elder home
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ message: 'Failed to register patient.' });
  }
});

// Elder home owner views all patient requests for their home
router.get('/elder-home/:elderHomeId', async (req, res) => {
  try {
    const patients = await Patient.find({ elderHomeId: req.params.elderHomeId });
    res.json(patients);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch patients.' });
  }
});

// Donor views their submitted patients
router.get('/donor/:donorId', async (req, res) => {
  try {
    const patients = await Patient.find({ donorId: req.params.donorId });
    res.json(patients);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch patients.' });
  }
});

// Get all approved patients (for admin)
router.get('/approved', async (req, res) => {
  try {
    const patients = await Patient.find({ status: 'approved' });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch approved patients.' });
  }
});

// Get patient details by id
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch patient.' });
  }
});

// Elder home owner approves a patient
router.patch('/:id/approve', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ message: 'Failed to approve patient.' });
  }
});

// Elder home owner rejects a patient
router.patch('/:id/reject', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ message: 'Failed to reject patient.' });
  }
});

// Donor updates their own patient registration
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    // Optionally, check donorId matches (for real auth, use req.user._id)
    if (req.body.donorId && patient.donorId.toString() !== req.body.donorId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    Object.assign(patient, req.body);
    await patient.save();
    res.json(patient);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update patient.' });
  }
});

// Donor deletes their own patient registration
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    
    // Check if the patient belongs to the donor
    if (patient.donorId.toString() !== req.body.donorId) {
      return res.status(403).json({ message: 'Unauthorized to delete this patient.' });
    }
    
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient deleted successfully.' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete patient.' });
  }
});

export default router; 