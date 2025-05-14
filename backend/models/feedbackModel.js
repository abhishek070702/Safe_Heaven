import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  homeType: { type: String, enum: ['elder', 'child'], required: true }, // 'elder' or 'child'
  homeId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the home
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Optional: null for anonymous
  username: { type: String, required: false }, // For anonymous or display
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback; 