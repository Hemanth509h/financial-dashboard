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

router.get('/analytics', async (req, res) => {
  try {
    const months = [];
    const now = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      });
    }

    const analyticsData = await Promise.all(months.map(async (m) => {
      // Earnings: amountPaid from WorkEntries paid in this month
      const entries = await WorkEntry.find({
        status: { $in: ['Paid', 'Partially Paid'] },
        datePaid: { $gte: m.start, $lte: m.end }
      });

      let earnings = 0;
      entries.forEach(entry => {
        // If it was paid in this month, we count the amountPaid
        // This is a simplification; in a real app we'd track individual payments
        earnings += (entry.amountPaid || 0);
      });

      // Repayments: Repayments in this month
      const repayments = await Repayment.find({
        date: { $gte: m.start, $lte: m.end }
      });
      const repaymentTotal = repayments.reduce((sum, r) => {
        if (!r.status || r.status === 'Success') {
          return sum + r.amount;
        }
        return sum;
      }, 0);

      return {
        month: m.name,
        earnings,
        repayments: repaymentTotal
      };
    }));

    res.json(analyticsData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const entries = await WorkEntry.find({});
    const clientData = entries.reduce((acc, entry) => {
      const client = entry.client;
      if (!acc[client]) {
        acc[client] = {
          name: client,
          totalEarned: 0,
          pendingAmount: 0,
          workCount: 0,
          lastWorkDate: entry.date
        };
      }
      const earned = entry.status === 'Paid' ? entry.amount : (entry.amountPaid || 0);
      const pending = entry.amount - earned;
      acc[client].totalEarned += earned;
      acc[client].pendingAmount += pending;
      acc[client].workCount += 1;
      if (new Date(entry.date) > new Date(acc[client].lastWorkDate)) {
        acc[client].lastWorkDate = entry.date;
      }
      return acc;
    }, {});
    const result = Object.values(clientData).sort((a, b) => b.totalEarned - a.totalEarned);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
