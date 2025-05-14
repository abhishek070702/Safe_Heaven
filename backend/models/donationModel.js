import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Donor' // Reference to the Donor model
  },
  donorType: {
    type: String,
    enum: ['donor', 'volunteer', 'elderHomeOwner'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Donation amount must be positive']
  },
  amountLKR: {
    type: Number,
    required: true,
    min: [0.01, 'Donation amount in LKR must be positive']
  },
  currency: {
    type: String,
    required: true
  },
  donationType: {
    type: String,
    enum: ['money', 'goods', 'time'], // Example types
    required: true,
    default: 'money'
  },
  description: { // Optional description for goods/time
    type: String,
    trim: true
  },
  // Optional: Link donation to a specific home
  elderHome: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderHomeOwner' 
  },
  // Optional: If donation is related to a specific volunteer activity
  volunteerActivity: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VolunteerActivity' // Assuming a potential VolunteerActivity model
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed' // Or 'pending' if payment integration needed
  },
  paymentId: { // Optional: For payment gateway reference
    type: String 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const Donation = mongoose.model('Donation', donationSchema);

export default Donation; 