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
import themeRoutes from './routes/theme.routes';
import offerRoutes from './routes/offer.routes';
import adminRoutes from './routes/admin.routes';
import commentRoutes from './routes/comment.routes';
import commentAdminRoutes from './routes/comment-admin.routes';
import emailTemplateRoutes from './routes/email-template.routes';
import emailCampaignRoutes from './routes/email-campaign.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
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

// Webhook routes (must be before other routes - no auth required)
app.use('/webhooks', webhookRoutes);

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
app.use('/api/themes', themeRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin/comments', commentAdminRoutes);
app.use('/api/admin/email-templates', emailTemplateRoutes);
app.use('/api/admin/email-campaigns', emailCampaignRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB');

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
