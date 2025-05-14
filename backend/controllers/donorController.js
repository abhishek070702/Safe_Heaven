import Donor from '../models/donorModel.js';
import generateToken from '../utils/generateToken.js';
import logger from '../config/logger.js';

// @desc    Register a new donor
// @route   POST /api/donors/register
// @access  Public
const registerDonor = async (req, res) => {
  try {
    const { fullName, email, address, contactNumber, username, password } = req.body;
    
    logger.debug('Donor registration data received:', req.body);

    // Check if donor exists by username or email
    const userExists = await Donor.findOne({ 
      $or: [{ username }, { email }]
    });

    if (userExists) {
      return res.status(400).json({ 
        message: userExists.username === username 
          ? 'Username already exists' 
          : 'Email already in use' 
      });
    }

    // Set profile photo if uploaded
    const profilePhoto = req.file ? req.file.path : 'default-profile.jpg';

    // Create donor - use contactNumber directly
    const donor = await Donor.create({
      fullName,
      email,
      address,
      contactNumber, // Use the field name directly
      username,
      password,
      profilePhoto,
    });

    if (donor) {
      res.status(201).json({
        _id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        address: donor.address,
        contactNumber: donor.contactNumber,
        username: donor.username,
        profilePhoto: donor.profilePhoto,
        isBlocked: donor.isBlocked,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
        token: generateToken(donor._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid donor data' });
    }
  } catch (error) {
    logger.error('Donor registration error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Auth donor & get token
// @route   POST /api/donors/login
// @access  Public
const loginDonor = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check for donor
    const donor = await Donor.findOne({ username });

    if (donor && (await donor.matchPassword(password))) {
      // Check if donor is blocked
      if (donor.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
      }
      
      res.json({
        _id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        address: donor.address,
        contactNumber: donor.contactNumber,
        username: donor.username,
        profilePhoto: donor.profilePhoto,
        isBlocked: donor.isBlocked,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
        token: generateToken(donor._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get donor profile
// @route   GET /api/donors/profile
// @access  Private
const getDonorProfile = async (req, res) => {
  try {
    // req.donor should be populated by the 'protect' middleware
    const donor = await Donor.findById(req.donor._id).select('-password'); // Exclude password

    if (donor) {
      res.json({
        _id: donor._id,
        fullName: donor.fullName,
        username: donor.username,
        email: donor.email,
        contactNumber: donor.contactNumber,
        address: donor.address,
        description: donor.description,
        profilePhoto: donor.profilePhoto,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
        isBlocked: donor.isBlocked
      });
    } else {
      res.status(404).json({ message: 'Donor not found' });
    }
  } catch (error) {
    logger.error('[Get Donor Profile] Error:', error);
    res.status(500).json({ message: 'Server Error fetching profile' });
  }
};

// @desc    Update donor profile
// @route   PUT /api/donors/profile
// @access  Private
const updateDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.donor._id);

    if (donor) {
      // Check for username conflict if username is being changed
      if (req.body.username && req.body.username !== donor.username) {
        const usernameExists = await Donor.findOne({ username: req.body.username });
        if (usernameExists) {
          logger.warn(`[Update Donor Profile] Username '${req.body.username}' already exists.`);
          return res.status(400).json({ message: 'Username already exists' });
        }
        donor.username = req.body.username;
      }

      // Update other fields from req.body if they exist
      donor.fullName = req.body.fullName || donor.fullName;
      donor.email = req.body.email || donor.email;
      donor.address = req.body.address || donor.address;
      donor.contactNumber = req.body.contactNumber || donor.contactNumber;
      donor.description = req.body.description || donor.description; // Allow updating description

      // Handle password update (only if provided)
      if (req.body.password) {
        // The pre-save hook in the model will handle hashing
        donor.password = req.body.password;
         logger.debug('[Update Donor Profile] Password marked for update.');
      }

      // Handle profile photo update
      if (req.file) {
        // Assuming upload middleware stores path in req.file.path
        donor.profilePhoto = req.file.path;
        logger.debug('[Update Donor Profile] Profile photo updated to:', req.file.path);
      }

      const updatedDonor = await donor.save();
      logger.info('[Update Donor Profile] Profile updated successfully for:', updatedDonor.username);

      // Respond with updated details (excluding password) and a new token
      res.json({
        _id: updatedDonor._id,
        fullName: updatedDonor.fullName,
        username: updatedDonor.username,
        email: updatedDonor.email,
        contactNumber: updatedDonor.contactNumber,
        address: updatedDonor.address,
        description: updatedDonor.description,
        profilePhoto: updatedDonor.profilePhoto,
        isBlocked: updatedDonor.isBlocked,
        createdAt: updatedDonor.createdAt,
        updatedAt: updatedDonor.updatedAt,
        token: generateToken(updatedDonor._id), // Send back a new token
      });

    } else {
      logger.warn('[Update Donor Profile] Donor not found with ID:', req.donor._id);
      res.status(404).json({ message: 'Donor not found' });
    }
  } catch (error) {
    logger.error('[Update Donor Profile] Error during profile update:', error);
    // Provide more specific error messages if possible (e.g., validation errors)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server Error during update' });
  }
};

// @desc    Delete donor account
// @route   DELETE /api/donors/profile
// @access  Private
const deleteDonorAccount = async (req, res) => {
  try {
    const donor = await Donor.findById(req.donor._id);

    if (donor) {
      await Donor.deleteOne({ _id: donor._id }); // Use deleteOne for consistency
      logger.info('[Delete Donor Account] Account deleted successfully for ID:', req.donor._id);
      res.json({ message: 'Account deleted successfully' });
    } else {
      logger.warn('[Delete Donor Account] Donor not found with ID:', req.donor._id);
      res.status(404).json({ message: 'Donor not found' });
    }
  } catch (error) {
    logger.error('[Delete Donor Account] Error:', error);
    res.status(500).json({ message: 'Server Error deleting account' });
  }
};

export {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorProfile,
  deleteDonorAccount
}; 