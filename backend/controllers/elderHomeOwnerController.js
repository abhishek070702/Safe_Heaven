import ElderHomeOwner from '../models/elderHomeOwnerModel.js';
import generateToken from '../utils/generateToken.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up file paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get relative path
const getRelativePath = (absolutePath) => {
  if (!absolutePath) return null;
  // Find the position of 'uploads' and take everything after it
  const uploadsIndex = absolutePath.indexOf('uploads');
  if (uploadsIndex === -1) {
    // If 'uploads' isn't in the path (shouldn't happen with multer setup), 
    // perhaps return the original path or handle as an error
    console.warn(`Could not find 'uploads' in path: ${absolutePath}`);
    return absolutePath; // Or return null or throw error
  }
  // Extract the part starting from 'uploads'
  const relative = absolutePath.substring(uploadsIndex);
  // Normalize slashes for cross-platform compatibility (important!)
  return relative.replace(/\\/g, '/');
};

// @desc    Register a new elder home owner
// @route   POST /api/elder-homes/register
// @access  Public
const registerElderHomeOwner = async (req, res, next) => {
  // Outer try-catch to ensure errors are passed to the global handler
  try {
    // Destructure ONLY fields present in the model
    const { 
      fullName, username, email, password, contactNumber, address, 
      elderHomeName, elderHomeAddress, accountNumber, capacity
    } = req.body;

    // Check if username or email already exists
    const userExists = await ElderHomeOwner.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      // Throwing an error here will be caught by the outer catch
      const err = new Error(userExists.username === username ? 'Username already exists' : 'Email already in use');
      err.statusCode = 400; // Set appropriate status code
      throw err;
    }

    // Get file paths from req.files - Ensure req.files exists
    if (!req.files) {
        const err = new Error('File upload data is missing.');
        err.statusCode = 400;
        throw err;
    }
    
    // --- FIX: Create RELATIVE paths relative to the 'uploads' directory ---
    const getRelativeUploadPath = (file) => {
      if (!file) return null;
      // Example file.path: 'C:\\...\\backend\\uploads\\homes\\image.jpg'
      // Example file.filename: 'homes-12345.jpg'
      // We need 'homes/image.jpg' or 'licenses/doc.pdf'

      const filename = file.filename; // e.g., licenseDocument-1713000000000.pdf or homePhotos-1713000000001.jpg
      const fieldname = file.fieldname; // 'licenseDocument' or 'homePhotos'

      let subfolder = '';
      if (fieldname === 'licenseDocument') {
          subfolder = 'licenses';
      } else if (fieldname === 'homePhotos') {
          subfolder = 'homes';
      } else {
          // Fallback or error? For now, assume it's one of the two
          console.warn(`Unexpected fieldname in getRelativeUploadPath: ${fieldname}`);
          // Determine subfolder based on filename prefix if possible, otherwise default
          if (filename.startsWith('licenseDocument-')) subfolder = 'licenses';
          else subfolder = 'homes'; // Default assumption
      }
      
      // Construct the path relative to the '/uploads/' route
      const relativePath = `${subfolder}/${filename}`; 
      return relativePath; // e.g., 'licenses/licenseDocument-1713000000000.pdf' or 'homes/homePhotos-1713000000001.jpg'
    };

    const licensePath = req.files.licenseDocument ? getRelativeUploadPath(req.files.licenseDocument[0]) : null;
    const homePhotoPaths = req.files.homePhotos ? req.files.homePhotos.map(file => getRelativeUploadPath(file)) : [];

    // Validate required fields (including license file)
    if (!licensePath) {
        const err = new Error('License document upload is required');
        err.statusCode = 400;
        throw err;
    }

    // Validate account number
    if (!accountNumber || !/^\d{16}$/.test(accountNumber)) {
      const err = new Error('Account number must be exactly 16 digits');
      err.statusCode = 400;
      throw err;
    }
    // Validate elderHomeName length
    if (!elderHomeName || elderHomeName.length > 20) {
      const err = new Error('Elder home name cannot exceed 20 characters');
      err.statusCode = 400;
      throw err;
    }
    // Validate license file type
    const licenseFile = req.files.licenseDocument[0];
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(licenseFile.mimetype)) {
      const err = new Error('License document must be a PDF or image file (JPG, JPEG, PNG)');
      err.statusCode = 400;
      throw err;
    }

    // 1. Username: required, unique, min 3 chars, only letters/numbers/underscores
    if (!username || !/^[A-Za-z0-9_]+$/.test(username) || username.length < 3) {
      const err = new Error('Username must be at least 3 characters and only contain letters, numbers, and underscores');
      err.statusCode = 400;
      throw err;
    }
    // 2. Email: required, unique, valid format
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      const err = new Error('Invalid email address');
      err.statusCode = 400;
      throw err;
    }
    // 3. Elder Home Name: required, unique, max 10 chars
    if (!elderHomeName || elderHomeName.length > 10) {
      const err = new Error('Elder home name is required and must be 10 characters or less');
      err.statusCode = 400;
      throw err;
    }
    const homeNameExists = await ElderHomeOwner.findOne({ elderHomeName });
    if (homeNameExists) {
      const err = new Error('Elder home name already exists');
      err.statusCode = 400;
      throw err;
    }
    // 4. Owner Name: required, only letters
    if (!fullName || !/^[A-Za-z ]+$/.test(fullName)) {
      const err = new Error('Owner name can only contain letters');
      err.statusCode = 400;
      throw err;
    }
    // 5. Address: required, max 20 chars
    if (!address || address.length > 20) {
      const err = new Error('Address is required and must be 20 characters or less');
      err.statusCode = 400;
      throw err;
    }
    // 6. Capacity: required, must be a number
    if (!capacity || isNaN(Number(capacity))) {
      const err = new Error('Capacity is required and must be a number');
      err.statusCode = 400;
      throw err;
    }
    // 7. License Document: required, file type (PDF or image), size limit (handled by multer, but check mimetype)
    if (!req.files || !req.files.licenseDocument || req.files.licenseDocument.length === 0) {
      const err = new Error('License document is required');
      err.statusCode = 400;
      throw err;
    }
    // 8. Description: required, max 50 chars
    if (!req.body.description || req.body.description.length > 50) {
      const err = new Error('Description is required and must be 50 characters or less');
      err.statusCode = 400;
      throw err;
    }
    // 9. Contact Info: required, exactly 10 digits, numbers only
    if (!contactNumber || !/^[0-9]{10}$/.test(contactNumber)) {
      const err = new Error('Contact number must be exactly 10 digits');
      err.statusCode = 400;
      throw err;
    }
    // 10. Photo Uploads: file type (image), size, max number (handled by multer, but check mimetype)
    if (!req.files.homePhotos || req.files.homePhotos.length === 0) {
      const err = new Error('At least one home photo is required');
      err.statusCode = 400;
      throw err;
    }
    if (req.files.homePhotos.length > 5) {
      const err = new Error('You can upload a maximum of 5 home photos');
      err.statusCode = 400;
      throw err;
    }
    for (const photo of req.files.homePhotos) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(photo.mimetype)) {
        const err = new Error('Home photos must be image files (JPG, JPEG, PNG, GIF)');
        err.statusCode = 400;
        throw err;
      }
    }

    // Prepare data object for creation (uses relative paths now)
    const ownerDataToCreate = {
        fullName,
        username,
        email,
        password, // Hashed by pre-save hook
        contactNumber,
        address, 
        elderHomeName,
        elderHomeAddress,
        accountNumber,
        capacity,
        license: licensePath,
        homePhotos: homePhotoPaths,
        approvalStatus: 'pending'
    };

    // --- Enhanced Logging --- 
    console.log('--- Attempting to create ElderHomeOwner --- ');
    const logData = { ...ownerDataToCreate };
    delete logData.password; 
    console.log('Data prepared for creation (relative paths, excluding password):', logData);

    // Create the new ElderHomeOwner document with specific logging
    let elderHomeOwner;
    try {
      console.log('>>> Calling ElderHomeOwner.create...');
      elderHomeOwner = await ElderHomeOwner.create(ownerDataToCreate);
      console.log('<<< ElderHomeOwner.create SUCCEEDED:', elderHomeOwner?._id);
    } catch (dbError) {
      console.error('!!! ERROR DURING ElderHomeOwner.create !!!');
      console.error('DB Error Message:', dbError.message);
      console.error('DB Error Stack:', dbError.stack);
      // Re-throw the error to be caught by the outer catch block and passed to next()
      throw dbError; 
    }

    if (elderHomeOwner) {
      console.log(`Elder Home Owner registered successfully: ${elderHomeOwner.username} (${elderHomeOwner._id})`);
      res.status(201).json({
        message: 'Registration successful! Your application is pending admin approval.'
      });
    } else {
      // This case should theoretically not be reached if create throws on failure
      const err = new Error('Failed to create elder home owner data (create returned falsy)');
      err.statusCode = 400;
      throw err;
    }
    // --- Original function body ends here ---

  } catch (error) {
    // Log the error caught within the controller before passing it on
    console.error('!!! ERROR CAUGHT WITHIN registerElderHomeOwner CONTROLLER (OUTER CATCH) !!!');
    console.error('Outer Catch Error Message:', error.message);
    // Pass the error to the global error handler
    next(error); 
  }
};

// @desc    Auth elder home owner & get token
// @route   POST /api/elder-homes/login
// @access  Public
const loginElderHomeOwner = async (req, res) => {
  try {
    // Destructure username and password from req.body
    const { username, password } = req.body;

    // Find elder home owner by username
    const elderHomeOwner = await ElderHomeOwner.findOne({ username });

    if (elderHomeOwner && (await elderHomeOwner.matchPassword(password))) {
      // Check if elder home owner is blocked
      if (elderHomeOwner.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
      }
      
      // Check approval status
      if (elderHomeOwner.approvalStatus === 'pending') {
        return res.status(202).json({ 
          message: 'Your account is pending approval from admin.',
          approvalStatus: 'pending',
          _id: elderHomeOwner._id
        });
      } else if (elderHomeOwner.approvalStatus === 'rejected') {
        return res.status(403).json({ 
          message: 'Your account application was rejected.',
          approvalStatus: 'rejected',
          rejectionReason: elderHomeOwner.rejectionReason || 'No reason provided',
          _id: elderHomeOwner._id
        });
      }
      
      res.json({
        _id: elderHomeOwner._id,
        fullName: elderHomeOwner.fullName,
        email: elderHomeOwner.email,
        username: elderHomeOwner.username,
        elderHomeName: elderHomeOwner.elderHomeName,
        homePhoto: elderHomeOwner.homePhoto,
        approvalStatus: elderHomeOwner.approvalStatus,
        token: generateToken(elderHomeOwner._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get elder home owner profile
// @route   GET /api/elder-homes/profile
// @access  Private
const getElderHomeOwnerProfile = async (req, res) => {
  try {
    const elderHomeOwner = await ElderHomeOwner.findById(req.elderHomeOwner._id);

    if (elderHomeOwner) {
      res.json({
        _id: elderHomeOwner._id,
        fullName: elderHomeOwner.fullName,
        email: elderHomeOwner.email,
        address: elderHomeOwner.address,
        contactNumber: elderHomeOwner.contactNumber,
        username: elderHomeOwner.username,
        elderHomeName: elderHomeOwner.elderHomeName,
        elderHomeAddress: elderHomeOwner.elderHomeAddress,
        accountNumber: elderHomeOwner.accountNumber,
        capacity: elderHomeOwner.capacity,
        license: elderHomeOwner.license,
        homePhoto: elderHomeOwner.homePhoto,
      });
    } else {
      res.status(404).json({ message: 'Elder home owner not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update elder home owner profile
// @route   PUT /api/elder-homes/profile
// @access  Private
const updateElderHomeOwnerProfile = async (req, res) => {
  try {
    const elderHomeOwner = await ElderHomeOwner.findById(req.elderHomeOwner._id);

    if (elderHomeOwner) {
      // Update personal information
      elderHomeOwner.fullName = req.body.fullName || elderHomeOwner.fullName;
      elderHomeOwner.email = req.body.email || elderHomeOwner.email;
      elderHomeOwner.address = req.body.address || elderHomeOwner.address;
      elderHomeOwner.contactNumber = req.body.contactNumber || elderHomeOwner.contactNumber;
      
      // If username is being updated, check if it already exists
      if (req.body.username && req.body.username !== elderHomeOwner.username) {
        const usernameExists = await ElderHomeOwner.findOne({ username: req.body.username });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        elderHomeOwner.username = req.body.username;
      }
      
      // Update elder home information
      elderHomeOwner.elderHomeName = req.body.elderHomeName || elderHomeOwner.elderHomeName;
      elderHomeOwner.elderHomeAddress = req.body.elderHomeAddress || elderHomeOwner.elderHomeAddress;
      elderHomeOwner.accountNumber = req.body.accountNumber || elderHomeOwner.accountNumber;
      elderHomeOwner.capacity = req.body.capacity || elderHomeOwner.capacity;
      
      // If password is provided, update it
      if (req.body.password) {
        elderHomeOwner.password = req.body.password;
      }
      
      // If new files are uploaded, update paths using relative paths
      if (req.files) {
        const getRelativeUploadPath = (file) => { // Re-using the helper logic from register
          if (!file) return null;
          const filename = file.filename; 
          const fieldname = file.fieldname; 
          let subfolder = '';
          if (fieldname === 'licenseDocument') subfolder = 'licenses';
          else if (fieldname === 'homePhotos') subfolder = 'homes';
          else { // Fallback logic (same as register)
             console.warn(`Unexpected fieldname in getRelativeUploadPath (update): ${fieldname}`);
             if (filename.startsWith('licenseDocument-')) subfolder = 'licenses'; else subfolder = 'homes';
          }
          return `${subfolder}/${filename}`; 
        };

        // Check for the fields used in registration middleware
        if (req.files.licenseDocument) {
          elderHomeOwner.license = getRelativeUploadPath(req.files.licenseDocument[0]);
        }
        // Assuming model uses 'homePhotos' (plural) as an array
        if (req.files.homePhotos && req.files.homePhotos.length > 0) {
           // Replace existing photos with new ones
           elderHomeOwner.homePhotos = req.files.homePhotos.map(file => getRelativeUploadPath(file));
        } else {
           // If updating but no new photos provided, should we clear existing? 
           // Decide based on requirements. For now, we only update if new files are present.
           // If you want to allow clearing, you'd need a separate mechanism.
        }
      }

      const updatedElderHomeOwner = await elderHomeOwner.save();

      // Make sure response includes the updated fields, especially homePhotos (plural)
      res.json({
        _id: updatedElderHomeOwner._id,
        fullName: updatedElderHomeOwner.fullName,
        email: updatedElderHomeOwner.email,
        username: updatedElderHomeOwner.username,
        elderHomeName: updatedElderHomeOwner.elderHomeName,
        // Ensure response uses the correct field name from the model ('homePhotos')
        homePhotos: updatedElderHomeOwner.homePhotos, // Assuming model uses plural
        token: generateToken(updatedElderHomeOwner._id),
      });
    } else {
      res.status(404).json({ message: 'Elder home owner not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete elder home owner account
// @route   DELETE /api/elder-homes/profile
// @access  Private
const deleteElderHomeOwnerAccount = async (req, res) => {
  try {
    const elderHomeOwner = await ElderHomeOwner.findById(req.elderHomeOwner._id);

    if (elderHomeOwner) {
      await ElderHomeOwner.deleteOne({ _id: elderHomeOwner._id });
      res.json({ message: 'Account deleted successfully' });
    } else {
      res.status(404).json({ message: 'Elder home owner not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get elder home owner dashboard data
// @route   GET /api/elder-homes/dashboard
// @access  Private
const getElderHomeOwnerDashboard = async (req, res) => {
  try {
    // req.elderHomeOwner should be populated by protectElderHomeOwner middleware
    const elderHomeOwner = await ElderHomeOwner.findById(req.elderHomeOwner._id).select('-password');

    if (!elderHomeOwner) {
      return res.status(404).json({ message: 'Elder home owner not found' });
    }

    // Return different data based on approval status
    if (elderHomeOwner.approvalStatus === 'pending') {
      return res.status(200).json({ 
        approvalStatus: 'pending',
        message: 'Your account is pending approval from admin.'
      });
    } else if (elderHomeOwner.approvalStatus === 'rejected') {
      return res.status(200).json({ 
        approvalStatus: 'rejected',
        message: 'Your account application was rejected.',
        rejectionReason: elderHomeOwner.rejectionReason || 'No reason provided'
      });
    }
      
    // For approved owners, return necessary dashboard data
    res.json({
      approvalStatus: 'approved',
      owner: {
        _id: elderHomeOwner._id,
        fullName: elderHomeOwner.fullName,
        email: elderHomeOwner.email,
        address: elderHomeOwner.address,
        contactNumber: elderHomeOwner.contactNumber,
        username: elderHomeOwner.username,
      },
      elderHome: {
        _id: elderHomeOwner._id,
        name: elderHomeOwner.elderHomeName,
        address: elderHomeOwner.elderHomeAddress,
        accountNumber: elderHomeOwner.accountNumber,
        capacity: elderHomeOwner.capacity,
        license: elderHomeOwner.license,
        homePhotos: elderHomeOwner.homePhotos,
      },
      isBlocked: elderHomeOwner.isBlocked,
      joinedDate: elderHomeOwner.createdAt,
      lastUpdated: elderHomeOwner.updatedAt
    });

  } catch (error) {
    console.error('Error fetching Elder Home Dashboard:', error);
    res.status(500).json({ message: 'Server Error fetching dashboard data' });
  }
};

// Check if elder home name already exists (for frontend uniqueness check)
export const checkElderHomeName = async (req, res) => {
  try {
    const { name } = req.params;
    const exists = await ElderHomeOwner.findOne({ elderHomeName: name });
    res.json({ available: !exists });
  } catch (err) {
    res.status(500).json({ message: 'Server error checking name' });
  }
};

export { 
  registerElderHomeOwner, 
  loginElderHomeOwner, 
  getElderHomeOwnerProfile, 
  updateElderHomeOwnerProfile, 
  deleteElderHomeOwnerAccount,
  getElderHomeOwnerDashboard
}; 