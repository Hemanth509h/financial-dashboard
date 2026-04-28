import admin from 'firebase-admin';
import cron from 'node-cron';
import NotificationToken from '../models/NotificationToken.js';
import Settings from '../models/Settings.js';
import WorkEntry from '../models/WorkEntry.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';

// Initialize Firebase Admin
const initializeFirebase = () => {
  if (admin.apps.length > 0) return;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT not found in environment variables. Notifications will not be sent.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
};

const getMetricsSummary = async () => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // 1. Total Earned This Month
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

  // 2. Pending Payments
  const pendingEntries = await WorkEntry.find({
    status: { $in: ['Unpaid', 'Partially Paid'] }
  });
  
  let pendingPayments = 0;
  pendingEntries.forEach(entry => {
    pendingPayments += (entry.amount - entry.amountPaid);
  });

  // 3. Active Loan Balance
  const activeLoans = await Loan.find({ status: 'Active' });
  let totalLoanBalance = 0;
  activeLoans.forEach(loan => {
    totalLoanBalance += (loan.totalAmount - loan.amountPaid);
  });

  return {
    earned: totalEarnedThisMonth,
    pending: pendingPayments,
    loans: totalLoanBalance
  };
};

export const sendDailyMetricsNotification = async () => {
  initializeFirebase();
  
  if (admin.apps.length === 0) return;

  try {
    const metrics = await getMetricsSummary();
    const tokens = await NotificationToken.find({}).select('token');
    
    if (tokens.length === 0) {
      console.log('No registered notification tokens found.');
      return;
    }

    const tokenList = tokens.map(t => t.token);
    const currency = process.env.CURRENCY_SYMBOL || '₹';

    const message = {
      notification: {
        title: 'Daily Financial Summary',
        body: `Earned: ${currency}${metrics.earned.toLocaleString()} | Pending: ${currency}${metrics.pending.toLocaleString()} | Loans: ${currency}${metrics.loans.toLocaleString()}`,
      },
      tokens: tokenList,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent daily notification to ${response.successCount} devices.`);
    
    // Update last notification sent time
    await Settings.findOneAndUpdate({}, { lastNotificationSent: new Date() }, { upsert: true });

    // Cleanup invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokenList[idx]);
        }
      });
      if (failedTokens.length > 0) {
        await NotificationToken.deleteMany({ token: { $in: failedTokens } });
        console.log(`Cleaned up ${failedTokens.length} invalid tokens.`);
      }
    }
  } catch (error) {
    console.error('Error sending daily metrics notification:', error);
  }
};

// Schedule the task
export const startCronJobs = () => {
  // Run every minute to check if it's the right time
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ notificationTime: '09:00' });
    }

    // Check if the current time matches the scheduled time
    if (settings.notificationTime === currentTime) {
      // Check if we already sent a notification today (to avoid double sending if cron runs twice in same minute)
      const lastSent = settings.lastNotificationSent;
      const alreadySentToday = lastSent && 
        lastSent.getDate() === now.getDate() && 
        lastSent.getMonth() === now.getMonth() && 
        lastSent.getFullYear() === now.getFullYear();

      if (!alreadySentToday) {
        console.log(`Time match (${currentTime})! Sending daily metrics notification...`);
        sendDailyMetricsNotification();
      }
    }
  });
  console.log('Notification cron jobs scheduled (checking every minute)');
};
