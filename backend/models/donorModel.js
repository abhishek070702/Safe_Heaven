import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const donorSchema = new mongoose.Schema(
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
      required: [true, 'Address is required']
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
    profilePhoto: {
      type: String,
      default: 'default-profile.jpg'
    },
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving to database
donorSchema.pre('save', async function(next) {
  // Only run this function if password was modified (or is new)
  if (!this.isModified('password')) {
    return next(); // Explicitly return after calling next()
  }
  
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
  } catch (error) {
      next(error); // Pass errors to Mongoose
  }
});

// Method to check if entered password matches the hashed password
donorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Donor = mongoose.model('Donor', donorSchema);

export default Donor; 