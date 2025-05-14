import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Different destinations based on file type
    const destination = file.fieldname === 'licenseDocument' 
      ? path.join(__dirname, '../uploads/licenses/') 
      : path.join(__dirname, '../uploads/homes/');
    cb(null, destination);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
function checkFileType(file, cb) {
  if (file.fieldname === 'licenseDocument') {
    // Define allowed extensions and mimetypes separately
    // Added application/pdf explicitly
    const allowedExtensions = /pdf|jpeg|jpg|png/;
    const allowedMimeTypes = /application\/pdf|image\/jpeg|image\/jpg|image\/png/;

    const isExtensionAllowed = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const isMimeTypeAllowed = allowedMimeTypes.test(file.mimetype);

    if (isMimeTypeAllowed && isExtensionAllowed) {
      return cb(null, true);
    } else {
      const errorMsg = 'Error: License must be a PDF or an image file (JPG, JPEG, PNG)!';
      logger.error('checkFileType Error (License):', errorMsg);
      cb(errorMsg);
    }
  } else if (file.fieldname === 'homePhotos') { 
    // <<< Allow ANY file type for homePhotos >>>
    logger.info(`Allowing file upload for homePhotos: ${file.originalname} (Type: ${file.mimetype})`);
    return cb(null, true); // Always return true, bypassing file type checks
  } else {
    // Handle unexpected fields
    logger.warn('Multer received unexpected fieldname:', file.fieldname);
    cb(null, false); // Ignore other fields silently
  }
}

// Init upload
const elderHomeUpload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default elderHomeUpload; 