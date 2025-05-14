import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  elderHomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ElderHome', required: true },
  joinedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' }],
  createdAt: { type: Date, default: Date.now },
  // Optional for backward compatibility
  duration: { type: String },
  rejectionReason: { type: String },
});

const Event = mongoose.model('Event', eventSchema);
export default Event;