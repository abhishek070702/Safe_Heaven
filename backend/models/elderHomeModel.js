import mongoose from 'mongoose';

const elderHomeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String }, // Elder home contact number
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'ElderHomeOwner', required: true },
  // Add other fields as needed for your app
});

const ElderHome = mongoose.model('ElderHome', elderHomeSchema);

export default ElderHome; 