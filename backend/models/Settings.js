import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  notificationTime: {
    type: String,
    default: '09:00' // HH:mm format
  },
  lastNotificationSent: {
    type: Date
  }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
