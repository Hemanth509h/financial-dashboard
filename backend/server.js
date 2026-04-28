import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import workEntryRoutes from './routes/workEntries.js';
import loanRoutes from './routes/loans.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

async function connectDatabase() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI must be set in production.');
    }
    console.log('MONGODB_URI not set, starting in-memory MongoDB for development...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('In-memory MongoDB started at', uri);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

connectDatabase().catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// API routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/work-logs', workEntryRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve the built frontend in production.
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

export default app;
