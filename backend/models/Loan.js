import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  lenderName: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Repaid'],
    default: 'Active',
  },
  amountPaid: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export default mongoose.model('Loan', loanSchema);
