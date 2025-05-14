import asyncHandler from 'express-async-handler';
import Volunteer from '../models/volunteerModel.js';
import generateToken from '../utils/generateToken.js';
import logger from '../config/logger.js';

// @desc    Register a new volunteer
// @route   POST /api/volunteers/register
// @access  Public
const registerVolunteer = asyncHandler(async (req, res) => {
  const {
    name,
    username,
    email,
    password,
    phone,
    age,
    dateOfBirth,
    address,
    role,
    description,
    skills,
    availability,
  } = req.body;

  logger.info('Received volunteer registration data:', req.body);
  
  // Full name: only letters
  if (!name || !/^[A-Za-z ]+$/.test(name)) {
    res.status(400);
    throw new Error('Full name can only contain letters');
  }
  // Username: only letters, min 3 chars
  if (!username || !/^[A-Za-z]+$/.test(username) || username.length < 3) {
    res.status(400);
    throw new Error('Username must be at least 3 letters and only contain letters');
  }
  // Username unique
  const usernameExists = await Volunteer.findOne({ username });
  if (usernameExists) {
    res.status(400);
    throw new Error('Username already exists');
  }
  // Email: valid, unique
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400);
    throw new Error('Invalid email address');
  }
  const emailExists = await Volunteer.findOne({ email });
  if (emailExists) {
    res.status(400);
    throw new Error('Email already exists');
  }
  // Password
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  if (!/[@]/.test(password)) {
    res.status(400);
    throw new Error('Password must include a special character like @');
  }
  if (!/[0-9]/.test(password)) {
    res.status(400);
    throw new Error('Password must include at least one number');
  }
  if (
    password.toLowerCase().includes(name.toLowerCase()) ||
    password.toLowerCase().includes(username.toLowerCase())
  ) {
    res.status(400);
    throw new Error('Password cannot contain your name or username');
  }
  // Phone: exactly 10 digits
  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    res.status(400);
    throw new Error('Contact number must be exactly 10 digits');
  }
  // Age and DOB must match (accurate calculation)
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
    if (calculatedAge !== parseInt(age, 10)) {
      res.status(400);
      throw new Error('Age and date of birth do not match');
    }
  }
  // Role required
  if (!role) {
    res.status(400);
    throw new Error('Volunteer role is required');
  }
  // Address: max 20 chars
  if (!address || address.length > 20) {
    res.status(400);
    throw new Error('Address must be 20 characters or less');
  }
  // Description required
  if (!description) {
    res.status(400);
    throw new Error('Description is required');
  }

  // Parse JSON strings if they're strings
  let parsedSkills = skills;
  let parsedAvailability = availability;
  
  try {
    if (typeof skills === 'string') {
      parsedSkills = JSON.parse(skills);
      logger.info('Parsed skills:', parsedSkills);
    }
    if (typeof availability === 'string') {
      parsedAvailability = JSON.parse(availability);
      logger.info('Parsed availability:', parsedAvailability);
    }
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    res.status(400);
    throw new Error('Invalid data format for skills or availability');
  }

  // Save profile photo as a relative path
  let profilePhotoPath = 'default-profile.jpg';
  if (req.file) {
    // Normalize slashes and ensure only the uploads/... part is saved
    const fullPath = req.file.path.replace(/\\/g, '/');
    const uploadsIndex = fullPath.indexOf('uploads/');
    profilePhotoPath = uploadsIndex !== -1 ? fullPath.substring(uploadsIndex) : fullPath;
  }

  const volunteer = await Volunteer.create({
    name,
    username,
    email,
    password,
    phone,
    age,
    dateOfBirth,
    address,
    role,
    description,
    skills: parsedSkills || [],
    availability: parsedAvailability || {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      timePreference: ''
    },
    profilePhoto: profilePhotoPath,
  });

  if (volunteer) {
    res.status(201).json({
      _id: volunteer._id,
      name: volunteer.name,
      username: volunteer.username,
      email: volunteer.email,
      phone: volunteer.phone,
      age: volunteer.age,
      dateOfBirth: volunteer.dateOfBirth,
      address: volunteer.address,
      role: volunteer.role,
      description: volunteer.description,
      skills: volunteer.skills,
      availability: volunteer.availability,
      profilePhoto: volunteer.profilePhoto,
      isBlocked: volunteer.isBlocked,
      token: generateToken(volunteer._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid volunteer data');
  }
});

// @desc    Auth volunteer & get token
// @route   POST /api/volunteers/login
// @access  Public
const loginVolunteer = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const volunteer = await Volunteer.findOne({ username });

  if (volunteer && (await volunteer.matchPassword(password))) {
    if (volunteer.isBlocked) {
      res.status(401);
      throw new Error('Your account has been blocked. Please contact the administrator.');
    }

    res.json({
      _id: volunteer._id,
      name: volunteer.name,
      username: volunteer.username,
      email: volunteer.email,
      phone: volunteer.phone,
      age: volunteer.age,
      dateOfBirth: volunteer.dateOfBirth,
      address: volunteer.address,
      role: volunteer.role,
      description: volunteer.description,
      skills: volunteer.skills,
      availability: volunteer.availability,
      profilePhoto: volunteer.profilePhoto,
      isBlocked: volunteer.isBlocked,
      token: generateToken(volunteer._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid username or password');
  }
});

// @desc    Get volunteer profile
// @route   GET /api/volunteers/profile
// @access  Private
const getVolunteerProfile = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.volunteer._id);

  if (volunteer) {
    res.json({
      _id: volunteer._id,
      name: volunteer.name,
      username: volunteer.username,
      email: volunteer.email,
      phone: volunteer.phone,
      age: volunteer.age,
      dateOfBirth: volunteer.dateOfBirth,
      address: volunteer.address,
      role: volunteer.role,
      description: volunteer.description,
      skills: volunteer.skills,
      availability: volunteer.availability,
      profilePhoto: volunteer.profilePhoto,
      isBlocked: volunteer.isBlocked,
      createdAt: volunteer.createdAt,
      updatedAt: volunteer.updatedAt,
    });
  } else {
    res.status(404);
    throw new Error('Volunteer not found');
  }
});

// @desc    Update volunteer profile
// @route   PUT /api/volunteers/profile
// @access  Private
const updateVolunteerProfile = asyncHandler(async (req, res, next) => {
  logger.debug('--- Received Update Request ---');
  logger.debug('Request Body:', req.body);
  logger.debug('Request File:', req.file);

  const volunteer = await Volunteer.findById(req.volunteer._id);

  if (volunteer) {
    // Check if username is being changed and if the new username already exists
    const newUsername = req.body.username;
    if (newUsername && newUsername !== volunteer.username) {
      // Add validation for username format if needed
      if (!/^[a-zA-Z0-9_]+$/.test(newUsername) || newUsername.length < 3) {
        res.status(400);
        throw new Error('Invalid username format (min 3 chars, letters, numbers, underscores only)');
      }
      const usernameExists = await Volunteer.findOne({ username: newUsername });
      if (usernameExists) {
        res.status(400);
        throw new Error('Username already taken');
      }
      volunteer.username = newUsername;
    }

    // Check if email is being changed and if the new email already exists
    const newEmail = req.body.email;
    if (newEmail && newEmail !== volunteer.email) {
      // Add validation for email format if needed
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(newEmail)) {
         res.status(400);
         throw new Error('Invalid email format');
      }
      const emailExists = await Volunteer.findOne({ email: newEmail });
      if (emailExists) {
        res.status(400);
        throw new Error('Email already registered');
      }
      volunteer.email = newEmail;
    }

    // Update other fields that are allowed to change
    volunteer.name = req.body.name || volunteer.name;
    volunteer.phone = req.body.phone || volunteer.phone;
    volunteer.age = req.body.age || volunteer.age;
    volunteer.dateOfBirth = req.body.dateOfBirth || volunteer.dateOfBirth;
    volunteer.address = req.body.address || volunteer.address;
    volunteer.role = req.body.role || volunteer.role;
    volunteer.description = req.body.description || volunteer.description;
    
    // Update skills if provided
    if (req.body.skills) {
      try {
        // Parse if it's a string
        if (typeof req.body.skills === 'string') {
          volunteer.skills = JSON.parse(req.body.skills);
        } else if (Array.isArray(req.body.skills)) { // Ensure it's an array if not a string
          volunteer.skills = req.body.skills;
        } else {
           throw new Error('Skills data must be an array or a JSON string representation of an array');
        }
      } catch (error) {
        logger.error('Error processing skills data:', error);
        res.status(400);
        throw new Error('Invalid data format for skills');
      }
    }
    
    // Update availability if provided
    if (req.body.availability) {
      try {
        let parsedAvailability = {};
        // Parse if it's a string
        if (typeof req.body.availability === 'string') {
          parsedAvailability = JSON.parse(req.body.availability);
        } else if (typeof req.body.availability === 'object' && req.body.availability !== null) { // Ensure it's an object if not a string
          parsedAvailability = req.body.availability;
        } else {
          throw new Error('Availability data must be an object or a JSON string representation of an object');
        }
         volunteer.availability = {
            ...volunteer.availability, // Keep existing fields if not provided
            ...parsedAvailability
          };
      } catch (error) {
        logger.error('Error processing availability data:', error);
        res.status(400);
        throw new Error('Invalid data format for availability');
      }
    }

    if (req.file) {
      // Save profile photo as a relative path
      const fullPath = req.file.path.replace(/\\/g, '/');
      const uploadsIndex = fullPath.indexOf('uploads/');
      volunteer.profilePhoto = uploadsIndex !== -1 ? fullPath.substring(uploadsIndex) : fullPath;
    }
    
    // Update password only if provided and non-empty
    if (req.body.password) {
      if (req.body.password.length < 6) {
         res.status(400);
         throw new Error('Password must be at least 6 characters long');
      }
      volunteer.password = req.body.password; // Hashing happens in pre-save hook
    }

    const updatedVolunteer = await volunteer.save();
    logger.debug('Saved updated volunteer data:', updatedVolunteer);

    res.json({
      _id: updatedVolunteer._id,
      name: updatedVolunteer.name,
      username: updatedVolunteer.username,
      email: updatedVolunteer.email,
      phone: updatedVolunteer.phone,
      age: updatedVolunteer.age,
      dateOfBirth: updatedVolunteer.dateOfBirth,
      address: updatedVolunteer.address,
      role: updatedVolunteer.role,
      description: updatedVolunteer.description,
      skills: updatedVolunteer.skills,
      availability: updatedVolunteer.availability,
      profilePhoto: updatedVolunteer.profilePhoto,
      isBlocked: updatedVolunteer.isBlocked,
      token: generateToken(updatedVolunteer._id),
    });
  } else {
    res.status(404);
    throw new Error('Volunteer not found');
  }
});

// @desc    Delete volunteer profile
// @route   DELETE /api/volunteers/profile
// @access  Private
const deleteVolunteerProfile = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.volunteer._id);

  if (volunteer) {
    await volunteer.deleteOne();
    res.json({ message: 'Volunteer removed' });
  } else {
    res.status(404);
    throw new Error('Volunteer not found');
  }
});

// @desc    Get volunteer dashboard data
// @route   GET /api/volunteers/dashboard
// @access  Private
const getVolunteerDashboard = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.volunteer._id);

    if (volunteer) {
      res.json({
        personalInfo: {
          _id: volunteer._id,
          name: volunteer.name,
          email: volunteer.email,
          phone: volunteer.phone,
          address: volunteer.address,
          age: volunteer.age,
          dateOfBirth: volunteer.dateOfBirth,
          gender: volunteer.gender,
          role: volunteer.role,
          specialization: volunteer.specialization,
          availability: volunteer.availability,
          skills: volunteer.skills,
          experience: volunteer.experience,
          description: volunteer.description,
          profilePicture: volunteer.profilePhoto,
          isBlocked: volunteer.isBlocked,
        },
        joinedDate: volunteer.createdAt,
        lastUpdated: volunteer.updatedAt
      });
    } else {
      res.status(404).json({ message: 'Volunteer not found' });
    }
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Check if volunteer username is available
export const checkVolunteerUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const exists = await Volunteer.findOne({ username });
  res.json({ available: !exists });
});

// Check if volunteer email is available
export const checkVolunteerEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const exists = await Volunteer.findOne({ email });
  res.json({ available: !exists });
});

// @desc    Submit feedback for a volunteer
// @route   POST /api/volunteers/:id/feedback
// @access  Public
const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;
  const volunteerId = req.params.id;

  // Validate input
  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Please provide a valid rating between 1 and 5');
  }

  if (!feedback || feedback.trim().length === 0) {
    res.status(400);
    throw new Error('Please provide feedback text');
  }

  const volunteer = await Volunteer.findById(volunteerId);

  if (!volunteer) {
    res.status(404);
    throw new Error('Volunteer not found');
  }

  // Add the new rating and feedback
  volunteer.ratings.push(rating);
  volunteer.feedback.push(feedback);

  // Calculate new average rating
  const totalRatings = volunteer.ratings.reduce((sum, r) => sum + r, 0);
  volunteer.averageRating = totalRatings / volunteer.ratings.length;

  await volunteer.save();

  res.status(201).json({
    message: 'Feedback submitted successfully',
    volunteer: {
      _id: volunteer._id,
      name: volunteer.name,
      averageRating: volunteer.averageRating,
      totalRatings: volunteer.ratings.length
    }
  });
});

export {
  registerVolunteer,
  loginVolunteer,
  getVolunteerProfile,
  updateVolunteerProfile,
  deleteVolunteerProfile,
  getVolunteerDashboard,
  submitFeedback
}; 