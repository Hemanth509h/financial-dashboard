import mongoose from 'mongoose';

const repaymentSchema = new mongoose.Schema({
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  method: {
    type: String,
    default: 'Cash', // Auto-Debit, UPI Transfer, Cash, etc.
  },
  status: {
    type: String,
    enum: ['Pending', 'Success'],
    default: 'Success',
  }
}, { timestamps: true });

export default mongoose.model('Repayment', repaymentSchema);
