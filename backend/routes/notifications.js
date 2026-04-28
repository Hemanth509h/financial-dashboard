import express from 'express';
import NotificationToken from '../models/NotificationToken.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// Get notification settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ notificationTime: '09:00' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update notification settings
router.post('/settings', async (req, res) => {
  try {
    const { notificationTime } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { notificationTime },
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register or update a device token
router.post('/register', async (req, res) => {
  try {
    const { token, deviceType } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Upsert the token
    const updatedToken = await NotificationToken.findOneAndUpdate(
      { token },
      { token, deviceType, lastUsed: new Date() },
      { upsert: true, new: true }
    );

    res.json({ message: 'Token registered successfully', data: updatedToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unregister a device token
router.post('/unregister', async (req, res) => {
  try {
    const { token } = req.body;
    await NotificationToken.findOneAndDelete({ token });
    res.json({ message: 'Token unregistered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
