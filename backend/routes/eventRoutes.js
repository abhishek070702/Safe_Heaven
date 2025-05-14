import express from 'express';
import Event from '../models/eventModel.js';
import ElderHome from '../models/elderHomeModel.js'; 
import { protectVolunteer } from '../middleware/authMiddleware.js';
import Volunteer from '../models/volunteerModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' }).populate('elderHomeId', 'name contactNumber');
    res.json(events);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch events.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create event.' });
  }
});

router.get('/elder-home/:elderHomeId', async (req, res) => {
  try {
    const events = await Event.find({ elderHomeId: req.params.elderHomeId, status: 'approved' });
    res.json(events);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch events.' });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' });
    res.json(events);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch pending events.' });
  }
});

router.get('/approved', async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' });
    res.json(events);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch approved events.' });
  }
});

router.patch('/:id/approve', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: 'Failed to approve event.' });
  }
});

router.patch('/:id/reject', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: req.body.rejectionReason || '' },
      { new: true }
    );
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: 'Failed to reject event.' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update event.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete event.' });
  }
});

// Join an event
router.post('/:eventId/join', protectVolunteer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('elderHomeId', 'name contactNumber');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Cannot join an unapproved event' });
    }

    // Check if volunteer has already joined
    if (event.joinedVolunteers && event.joinedVolunteers.includes(req.volunteer._id)) {
      return res.status(400).json({ message: 'You have already joined this event' });
    }

    // Add volunteer to the event
    if (!event.joinedVolunteers) {
      event.joinedVolunteers = [];
    }
    event.joinedVolunteers.push(req.volunteer._id);
    await event.save();

    // Return the updated event with populated fields
    const updatedEvent = await Event.findById(event._id).populate('elderHomeId', 'name contactNumber');
    res.json({ 
      message: 'Successfully joined the event', 
      event: updatedEvent 
    });
  } catch (err) {
    console.error('Join event error:', err);
    res.status(500).json({ 
      message: 'Failed to join event',
      error: err.message 
    });
  }
});

// Remove from joined events
router.post('/:eventId/remove', protectVolunteer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    // Remove volunteer from the event
    event.joinedVolunteers = event.joinedVolunteers.filter(
      volunteerId => volunteerId.toString() !== req.volunteer._id.toString()
    );
    await event.save();
    // Add to eventHistory
    const volunteer = await Volunteer.findById(req.volunteer._id);
    if (!volunteer.eventHistory) volunteer.eventHistory = [];
    if (!volunteer.eventHistory.map(id => id.toString()).includes(event._id.toString())) {
      volunteer.eventHistory.push(event._id);
      await volunteer.save();
    }
    res.json({ message: 'Successfully removed from event' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from event' });
  }
});

// Mark event as completed
router.post('/:eventId/complete', protectVolunteer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    // Add to completed events and eventHistory
    const volunteer = await Volunteer.findById(req.volunteer._id);
    if (!volunteer.completedEvents) volunteer.completedEvents = [];
    if (!volunteer.eventHistory) volunteer.eventHistory = [];
    if (!volunteer.completedEvents.map(id => id.toString()).includes(event._id.toString())) {
      volunteer.completedEvents.push(event._id);
    }
    if (!volunteer.eventHistory.map(id => id.toString()).includes(event._id.toString())) {
      volunteer.eventHistory.push(event._id);
    }
    await volunteer.save();
    // Remove from joined events
    event.joinedVolunteers = event.joinedVolunteers.filter(
      volunteerId => volunteerId.toString() !== req.volunteer._id.toString()
    );
    await event.save();
    res.json({ message: 'Successfully marked event as completed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark event as completed' });
  }
});

export default router; 