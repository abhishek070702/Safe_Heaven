import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const volunteerSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    age: {
      type: Number,
      required: [true, 'Please add your age'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Please add your date of birth'],
    },
    address: {
      type: String,
      required: [true, 'Please add your address'],
    },
    role: {
      type: String,
      required: [true, 'Please specify your volunteer role'],
      enum: ['Caretaker', 'Medical Assistance', 'Educational Support', 'General Helper', 'Other'],
    },
    description: {
      type: String,
      required: [true, 'Please add a brief description about yourself'],
    },
    skills: {
      type: [String],
      default: [],
    },
    availability: {
      monday: {
        type: Boolean,
        default: false,
      },
      tuesday: {
        type: Boolean,
        default: false,
      },
      wednesday: {
        type: Boolean,
        default: false,
      },
      thursday: {
        type: Boolean,
        default: false,
      },
      friday: {
        type: Boolean,
        default: false,
      },
      saturday: {
        type: Boolean,
        default: false,
      },
      sunday: {
        type: Boolean,
        default: false,
      },
      timePreference: {
        type: String,
        default: '',
      },
    },
    profilePhoto: {
      type: String,
      default: 'default-profile.jpg',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    license: {
      type: String,
      default: '',
    },
    ratings: {
      type: [Number],
      default: [],
    },
    feedback: {
      type: [String],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    joinedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    completedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    eventHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  },
  {
    timestamps: true,
  }
);

// Match volunteer entered password to hashed password in database
volunteerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
volunteerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

export default Volunteer; 