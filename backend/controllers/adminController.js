import { Admin } from '../models/adminModel.js';
import Donor from '../models/donorModel.js';
import ElderHomeOwner from '../models/elderHomeOwnerModel.js';
import Volunteer from '../models/volunteerModel.js';
import Donation from '../models/donationModel.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcrypt';
import logger from '../config/logger.js';

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    logger.debug('Admin login request received:', req.body);
    const { username, password } = req.body;
    
    logger.debug('Login attempt for admin username:', username);

    // Debug: list all admin accounts
    const allAdmins = await Admin.find({});
    logger.debug('All admins in database:', allAdmins);

    // Check if we have an admin account at all
    if (allAdmins.length === 0) {
      logger.info('No admin accounts found in database. Creating default admin...');
      // Create a default admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = await Admin.create({
        username: 'admin',
        password: hashedPassword
      });
      
      logger.info('Default admin created:', newAdmin);
      
      // Return the newly created admin
      return res.json({
        _id: newAdmin._id,
        username: newAdmin.username,
        name: 'Administrator',
        token: generateToken(newAdmin._id),
        isAdmin: true
      });
    }

    // Check for admin by username
    const admin = await Admin.findOne({ username });
    logger.debug('Found admin by username:', admin ? 'Yes' : 'No');

    if (!admin) {
      logger.debug('Admin not found');
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Check password match
    const isMatch = await admin.matchPassword(password);
    logger.debug('Password match:', isMatch);

    if (isMatch) {
      // Create token payload
      const payload = {
        _id: admin._id,
        username: admin.username,
        name: 'Administrator',
        isAdmin: true
      };
      
      // Generate token
      const token = generateToken(admin._id);
      logger.debug('Token generated successfully');
      
      // Return user data and token
      return res.json({
        ...payload,
        token
      });
    } else {
      logger.debug('Password mismatch');
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    logger.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// === DONOR MANAGEMENT ===

// @desc    Get all donors
// @route   GET /api/admin/donors
// @access  Private/Admin
const getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find({}).select('-password').sort('-createdAt');
    
    // Add totalDonations property to each donor
    const donorsWithTotalDonations = donors.map(donor => {
      // Convert Mongoose document to plain object
      const donorObj = donor.toObject();
      
      // Add totalDonations field (in a real app, this would be calculated from actual donations)
      donorObj.totalDonations = 0; 
      
      return donorObj;
    });
    
    logger.debug(`Returning ${donorsWithTotalDonations.length} donors with added totalDonations field`);
    res.json(donorsWithTotalDonations);
  } catch (error) {
    logger.error('Error fetching donors:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get donor by ID
// @route   GET /api/admin/donors/:id
// @access  Private/Admin
const getDonorById = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).select('-password');

    if (donor) {
      res.json(donor);
    } else {
      res.status(404).json({ message: 'Donor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Block/unblock donor
// @route   PUT /api/admin/donors/:id/block
// @access  Private/Admin
const toggleBlockDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);

    if (donor) {
      donor.isBlocked = !donor.isBlocked;
      const updatedDonor = await donor.save();

      res.json({
        _id: updatedDonor._id,
        fullName: updatedDonor.fullName,
        email: updatedDonor.email,
        isBlocked: updatedDonor.isBlocked,
        message: updatedDonor.isBlocked ? 'Donor blocked successfully' : 'Donor unblocked successfully'
      });
    } else {
      res.status(404).json({ message: 'Donor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// === ELDER HOME OWNER MANAGEMENT ===

// @desc    Get all elder home owners
// @route   GET /api/admin/elder-homes
// @access  Private/Admin
const getAllElderHomeOwners = async (req, res) => {
  try {
    const elderHomeOwners = await ElderHomeOwner.find({}).select('-password').sort('-createdAt');
    res.json(elderHomeOwners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get pending elder home owners
// @route   GET /api/admin/elder-homes/pending
// @access  Private/Admin
const getPendingElderHomeOwners = async (req, res) => {
  try {
    const pendingElderHomeOwners = await ElderHomeOwner.find({ approvalStatus: 'pending' })
      .select('-password')
      .sort('-createdAt');
    res.json(pendingElderHomeOwners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get elder home owner by ID
// @route   GET /api/admin/elder-homes/:id
// @access  Private/Admin
const getElderHomeOwnerById = async (req, res) => {
  try {
    const elderHomeOwner = await ElderHomeOwner.findById(req.params.id).select('-password');

    if (elderHomeOwner) {
      res.json(elderHomeOwner);
    } else {
      res.status(404).json({ message: 'Elder home owner not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Approve elder home owner
// @route   PUT /api/admin/elder-homes/:id/approve
// @access  Private/Admin
const approveElderHomeOwner = async (req, res) => {
  try {
    const elderHomeOwner = await ElderHomeOwner.findById(req.params.id);

    if (elderHomeOwner) {
      elderHomeOwner.approvalStatus = 'approved';
      elderHomeOwner.rejectionReason = '';
      
      const updatedElderHomeOwner = await elderHomeOwner.save();

      res.json({
        _id: updatedElderHomeOwner._id,
        fullName: updatedElderHomeOwner.fullName,
        email: updatedElderHomeOwner.email,
        elderHomeName: updatedElderHomeOwner.elderHomeName,
        approvalStatus: updatedElderHomeOwner.approvalStatus,
        message: 'Elder home owner approved successfully'
      });
    } else {
      res.status(404).json({ message: 'Elder home owner not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reject elder home owner
// @route   PUT /api/admin/elder-homes/:id/reject
// @access  Private/Admin
const rejectElderHomeOwner = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const elderHomeOwner = await ElderHomeOwner.findById(req.params.id);

    if (elderHomeOwner) {
      elderHomeOwner.approvalStatus = 'rejected';
      elderHomeOwner.rejectionReason = rejectionReason || 'Application rejected by admin';
      
      const updatedElderHomeOwner = await elderHomeOwner.save();

      res.json({
        _id: updatedElderHomeOwner._id,
        fullName: updatedElderHomeOwner.fullName,
        email: updatedElderHomeOwner.email,
        elderHomeName: updatedElderHomeOwner.elderHomeName,
        approvalStatus: updatedElderHomeOwner.approvalStatus,
        rejectionReason: updatedElderHomeOwner.rejectionReason,
        message: 'Elder home owner rejected successfully'
      });
    } else {
      res.status(404).json({ message: 'Elder home owner not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Block/unblock elder home owner
// @route   PUT /api/admin/elder-homes/:id/block
// @access  Private/Admin
const toggleBlockElderHomeOwner = async (req, res) => {
  try {
    const elderHomeOwner = await ElderHomeOwner.findById(req.params.id);

    if (elderHomeOwner) {
      // Only approved elder homes can be blocked/unblocked
      if (elderHomeOwner.approvalStatus !== 'approved') {
        return res.status(400).json({ 
          message: 'Only approved elder homes can be blocked or unblocked' 
        });
      }
      
      elderHomeOwner.isBlocked = !elderHomeOwner.isBlocked;
      const updatedElderHomeOwner = await elderHomeOwner.save();

      res.json({
        _id: updatedElderHomeOwner._id,
        fullName: updatedElderHomeOwner.fullName,
        email: updatedElderHomeOwner.email,
        elderHomeName: updatedElderHomeOwner.elderHomeName,
        isBlocked: updatedElderHomeOwner.isBlocked,
        message: updatedElderHomeOwner.isBlocked ? 'Elder home owner blocked successfully' : 'Elder home owner unblocked successfully'
      });
    } else {
      res.status(404).json({ message: 'Elder home owner not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// === VOLUNTEER MANAGEMENT ===

// @desc    Get all volunteers
// @route   GET /api/admin/volunteers
// @access  Private/Admin
const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find({}).select('-password').sort('-createdAt');
    res.json(volunteers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get volunteer by ID
// @route   GET /api/admin/volunteers/:id
// @access  Private/Admin
const getVolunteerById = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id).select('-password');

    if (volunteer) {
      res.json(volunteer);
    } else {
      res.status(404).json({ message: 'Volunteer not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Block/unblock volunteer
// @route   PUT /api/admin/volunteers/:id/block
// @access  Private/Admin
const toggleBlockVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (volunteer) {
      volunteer.isBlocked = !volunteer.isBlocked;
      const updatedVolunteer = await volunteer.save();

      res.json({
        _id: updatedVolunteer._id,
        name: updatedVolunteer.name,
        email: updatedVolunteer.email,
        isBlocked: updatedVolunteer.isBlocked,
        message: updatedVolunteer.isBlocked ? 'Volunteer blocked successfully' : 'Volunteer unblocked successfully'
      });
    } else {
      res.status(404).json({ message: 'Volunteer not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// === DONATION MANAGEMENT (NEW) ===

// @desc    Get all donations
// @route   GET /api/admin/donations
// @access  Private/Admin
const getAllDonations = async (req, res) => {
  try {
    // Fetch donations, populate donor and elderHome info
    const donations = await Donation.find({})
      .populate('donor', 'fullName email')
      .populate('elderHome', 'name elderHomeName')
      .sort('-createdAt');
    logger.debug(`Fetched ${donations.length} donations for admin`);
    res.json(donations);
  } catch (error) {
    logger.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Server Error fetching donations' });
  }
};

// === DASHBOARD ===

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments();
    const totalVolunteers = await Volunteer.countDocuments();
    const totalElderHomes = await ElderHomeOwner.countDocuments({ approvalStatus: 'approved' });
    
    const pendingElderHomes = await ElderHomeOwner.countDocuments({ approvalStatus: 'pending' });
    
    const pendingApprovals = pendingElderHomes;
    
    const totalUsers = totalDonors + totalVolunteers + totalElderHomes;
    
    // Calculate actual total donations using aggregation
    const donationStats = await Donation.aggregate([
      {
        $group: {
          _id: null, // Group all donations together
          totalAmount: { $sum: '$amount' } // Sum the amount field
        }
      }
    ]);
    
    // Extract the total amount, default to 0 if no donations found
    const totalDonations = donationStats.length > 0 ? donationStats[0].totalAmount : 0;
    
    // TODO: Calculate recent donations (e.g., donations in the last 7 days)
    const recentDonations = 0; // Keeping this as 0 for now
    
    res.json({
      totalUsers,
      totalDonors,
      totalVolunteers,
      totalElderHomes,
      pendingApprovals,
      totalDonations, // Use the calculated value
      recentDonations
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export { 
  loginAdmin, 
  getAllDonors, 
  getDonorById, 
  toggleBlockDonor,
  getAllElderHomeOwners,
  getPendingElderHomeOwners,
  getElderHomeOwnerById,
  toggleBlockElderHomeOwner,
  approveElderHomeOwner,
  rejectElderHomeOwner,
  getAllVolunteers,
  getVolunteerById,
  toggleBlockVolunteer,
  getAllDonations,
  getAdminDashboard
}; 