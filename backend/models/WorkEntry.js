import mongoose from 'mongoose';

const workEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  client: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid'],
    default: 'Unpaid',
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  datePaid: {
    type: Date,
  }
}, { timestamps: true });

export default mongoose.model('WorkEntry', workEntrySchema);
