import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gigfinance_dev_secret_change_in_prod';

export const generateToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });

export const protect = async (req, res, next) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        email: 'default@example.com',
        password: 'defaultpassword123',
        name: 'Default User',
        currency: 'INR',
        monthlyGoal: 50000,
        theme: 'light'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('[AUTH] Failed to resolve default user:', err);
    res.status(500).json({ message: 'Internal server error resolving default user.' });
  }
};
