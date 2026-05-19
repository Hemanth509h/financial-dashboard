import express from 'express';
import WorkEntry from '../models/WorkEntry.js';

const router = express.Router();

// Get all work entries
router.get('/', async (req, res) => {
  try {
    const entries = await WorkEntry.find({}).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new work entry
router.post('/', async (req, res) => {
  const { date, client, amount, status, description } = req.body;
  try {
    let amountPaid = req.body.amountPaid || 0;
    if (status === 'Paid') amountPaid = amount;

    const newEntry = new WorkEntry({
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

// Update a work entry (e.g., mark as paid)
router.patch('/:id', async (req, res) => {
  try {
    const entry = await WorkEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

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

// Delete a work entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await WorkEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const deletedEntry = await WorkEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
