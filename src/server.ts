import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import exerciseRoutes from './routes/exercise.routes';
import mediaRoutes from './routes/media.routes';
import tagRoutes from './routes/tag.routes';
import paymentRoutes from './routes/payment.routes';
import photoDiaryRoutes from './routes/photo-diary.routes';
import exercisePurchaseRoutes from './routes/exercise-purchase.routes';
import marathonRoutes from './routes/marathon.routes';
import landingRoutes from './routes/landing.routes';
import exerciseCategoryRoutes from './routes/exerciseCategory.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://seplitza.github.io',
    'http://api-rejuvena.duckdns.org',
    'https://api-rejuvena.duckdns.org'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, '../admin-panel/dist')));
// Handle client-side routing for admin panel
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-panel/dist/index.html'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/user', authRoutes); // Legacy alias for frontend compatibility
app.use('/token', authRoutes); // Old Azure API compatibility (guest login)
app.use('/api/exercises', exerciseRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/photo-diary', photoDiaryRoutes);
app.use('/api/exercise-purchase', exercisePurchaseRoutes);
app.use('/api/marathons', marathonRoutes);
app.use('/api/landings', landingRoutes);
app.use('/api/exercise-categories', exerciseCategoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB');

    // Fix marathon progress index if needed
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collection = db.collection('marathonexerciseprogresses');
        const indexes = await collection.indexes();
        const oldIndexName = 'userId_1_marathonId_1_exerciseId_1';
        const newIndexName = 'userId_1_marathonId_1_dayNumber_1_exerciseId_1';
        
        const hasOldIndex = indexes.some(idx => idx.name === oldIndexName);
        const hasNewIndex = indexes.some(idx => idx.name === newIndexName);
        
        if (hasOldIndex) {
          console.log('🔧 Fixing marathon progress index...');
          await collection.dropIndex(oldIndexName);
          console.log('  ✓ Dropped old index');
        }
        
        if (!hasNewIndex) {
          await collection.createIndex(
            { userId: 1, marathonId: 1, dayNumber: 1, exerciseId: 1 },
            { unique: true, name: newIndexName }
          );
          console.log('  ✓ Created new index with dayNumber');
        }
        
        if (hasOldIndex || !hasNewIndex) {
          console.log('✅ Marathon progress index fixed');
        }
      }
    } catch (indexError) {
      console.warn('⚠️  Index migration warning:', indexError);
      // Don't fail startup if index fix fails
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

startServer();

export default app;
