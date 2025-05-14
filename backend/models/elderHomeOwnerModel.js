import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const elderHomeOwnerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    address: {
      type: String,
      required: [true, 'Personal address is required']
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required']
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    elderHomeName: {
      type: String,
      required: [true, 'Elder home name is required'],
      unique: true,
      maxlength: 20
    },
    elderHomeAddress: {
      type: String,
      required: [true, 'Elder home address is required']
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required']
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required']
    },
    license: {
      type: String,
      required: [true, 'License PDF is required']
    },
    homePhotos: {
      type: [String],
      default: []
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving to database
elderHomeOwnerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check if entered password matches the hashed password
elderHomeOwnerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const ElderHomeOwner = mongoose.model('ElderHomeOwner', elderHomeOwnerSchema);

export default ElderHomeOwner; 