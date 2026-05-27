import express from 'express';
import WorkEntry from '../models/WorkEntry.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const entries = await WorkEntry.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  const { date, client, amount, status, description } = req.body;
  try {
    let amountPaid = req.body.amountPaid || 0;
    if (status === 'Paid') amountPaid = amount;

    const newEntry = new WorkEntry({
      userId: req.user._id,
      date,
      client,
      amount,
      status,
      amountPaid,
      datePaid: status === 'Paid' ? (req.body.datePaid || date) : req.body.datePaid,
      description,
    });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const entry = await WorkEntry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const updateData = { ...req.body };
    if (updateData.status === 'Paid' && (!updateData.amountPaid || updateData.amountPaid === 0)) {
      updateData.amountPaid = entry.amount;
    }
    if (updateData.status === 'Paid' && !updateData.datePaid) {
      updateData.datePaid = entry.date;
    }

    const updatedEntry = await WorkEntry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entry = await WorkEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
