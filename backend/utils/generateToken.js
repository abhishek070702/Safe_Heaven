import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '1e2eebdd6f3ff3f8090536ab2f46df5a2d91dedc39b21e2c4ad2b979377a68b5', {
    expiresIn: '30d',
  });
};

export default generateToken; 