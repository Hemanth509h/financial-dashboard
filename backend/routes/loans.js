import express from 'express';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';

const router = express.Router();

// Get all loans
router.get('/', async (req, res) => {
  try {
    const loans = await Loan.find({}).sort({ startDate: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new loan
router.post('/', async (req, res) => {
  const { lenderName, totalAmount, startDate, status } = req.body;
  try {
    const newLoan = new Loan({ lenderName, totalAmount, startDate, status });
    await newLoan.save();
    res.status(201).json(newLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get repayments for a specific loan
router.get('/:id/repayments', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const repayments = await Repayment.find({ loanId: req.params.id }).sort({ date: -1 });
    res.json(repayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a repayment to a loan
router.post('/:id/repayments', async (req, res) => {
  const { amount, date, method, status } = req.body;
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const newRepayment = new Repayment({
      loanId: req.params.id,
      amount,
      date,
      method,
      status
    });
    
    await newRepayment.save();

    // Update loan's amountPaid
    if (status === 'Success' || !status) {
      loan.amountPaid += Number(amount);
      if (loan.amountPaid >= loan.totalAmount) {
        loan.status = 'Repaid';
      }
      await loan.save();
    }

    res.status(201).json(newRepayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a repayment
router.patch('/:id/repayments/:repaymentId', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const repayment = await Repayment.findOne({ _id: req.params.repaymentId, loanId: req.params.id });
    if (!repayment) return res.status(404).json({ message: 'Repayment not found' });

    const oldAmount = repayment.amount;
    const oldStatus = repayment.status;

    // Remove old amount from loan if it was successful
    if (oldStatus === 'Success' || !oldStatus) {
      loan.amountPaid -= Number(oldAmount);
    }

    const { amount, date, method, status } = req.body;
    
    // Update repayment fields
    if (amount !== undefined) repayment.amount = amount;
    if (date !== undefined) repayment.date = date;
    if (method !== undefined) repayment.method = method;
    if (status !== undefined) repayment.status = status;

    await repayment.save();

    // Add new amount to loan if successful
    if (repayment.status === 'Success' || !repayment.status) {
      loan.amountPaid += Number(repayment.amount);
    }

    // Update loan status
    if (loan.amountPaid >= loan.totalAmount) {
      loan.status = 'Repaid';
    } else {
      loan.status = 'Active';
    }
    await loan.save();

    res.json(repayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a repayment
router.delete('/:id/repayments/:repaymentId', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const repayment = await Repayment.findOne({ _id: req.params.repaymentId, loanId: req.params.id });
    if (!repayment) return res.status(404).json({ message: 'Repayment not found' });

    if (repayment.status === 'Success' || !repayment.status) {
      loan.amountPaid -= Number(repayment.amount);
      if (loan.amountPaid < loan.totalAmount) {
        loan.status = 'Active';
      }
      await loan.save();
    }

    await Repayment.findByIdAndDelete(req.params.repaymentId);
    
    res.json({ message: 'Repayment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a loan
router.patch('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a loan
router.delete('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    await Loan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Loan deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
