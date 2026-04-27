import express from 'express';
import WorkEntry from '../models/WorkEntry.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';

const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    // 1. Total Earned This Month (Received payments this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Sum of amountPaid for entries that have been partially or fully paid this month
    const paidEntries = await WorkEntry.find({
      status: { $in: ['Paid', 'Partially Paid'] },
      updatedAt: { $gte: startOfMonth }
    });
    
    let totalEarnedThisMonth = 0;
    paidEntries.forEach(entry => {
      if (entry.status === 'Paid') {
        totalEarnedThisMonth += entry.amount;
      } else {
        totalEarnedThisMonth += (entry.amountPaid || 0);
      }
    });

    // 2. Pending Payments (Unpaid and partially paid remaining balances)
    const pendingEntries = await WorkEntry.find({
      status: { $in: ['Unpaid', 'Partially Paid'] }
    });
    
    let pendingPayments = 0;
    let pendingCount = pendingEntries.length;
    pendingEntries.forEach(entry => {
      pendingPayments += (entry.amount - entry.amountPaid);
    });

    // 3. Total Loan Balance and Health
    const activeLoans = await Loan.find({ status: 'Active' });
    let totalLoanBalance = 0;
    let totalLoanGoal = 0;
    let totalLoanPaid = 0;
    
    activeLoans.forEach(loan => {
      totalLoanBalance += (loan.totalAmount - loan.amountPaid);
      totalLoanGoal += loan.totalAmount;
      totalLoanPaid += loan.amountPaid;
    });

    const recentRepaymentsThisMonth = await Repayment.find({
      date: { $gte: startOfMonth } // Simplified since status might not always be explicitly 'Success'
    });
    
    let totalRepaidThisMonth = 0;
    recentRepaymentsThisMonth.forEach(r => {
      if (!r.status || r.status === 'Success') {
        totalRepaidThisMonth += r.amount;
      }
    });

    // 4. Recent Activity (latest 5 work entries or repayments)
    const recentWork = await WorkEntry.find({}).sort({ createdAt: -1 }).limit(5);
    const recentRepayments = await Repayment.find({}).sort({ createdAt: -1 }).limit(5).populate('loanId');
    
    // Merge and sort
    const allActivity = [
      ...recentWork.map(w => ({ type: 'work', data: w, date: w.createdAt })),
      ...recentRepayments.map(r => ({ type: 'repayment', data: r, date: r.createdAt }))
    ].sort((a, b) => b.date - a.date).slice(0, 5);

    res.json({
      totalEarnedThisMonth,
      pendingPayments,
      pendingCount,
      totalLoanBalance,
      totalLoanGoal,
      totalLoanPaid,
      totalRepaidThisMonth,
      recentActivity: allActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
