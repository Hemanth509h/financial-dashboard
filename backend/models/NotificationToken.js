import mongoose from 'mongoose';

const notificationTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  deviceType: {
    type: String,
    default: 'web'
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const NotificationToken = mongoose.model('NotificationToken', notificationTokenSchema);

export default NotificationToken;
