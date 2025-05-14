import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  elderHomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ElderHomeOwner', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  nationalId: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  phoneNumber: { type: String, required: true },
  dob: { type: Date, required: true },
  medicalCondition: { type: String },
  allergies: { type: String },
  specialCareRequirement: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient; 