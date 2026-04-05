"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const exercise_routes_1 = __importDefault(require("./routes/exercise.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const tag_routes_1 = __importDefault(require("./routes/tag.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const photo_diary_routes_1 = __importDefault(require("./routes/photo-diary.routes"));
const exercise_purchase_routes_1 = __importDefault(require("./routes/exercise-purchase.routes"));
const marathon_routes_1 = __importDefault(require("./routes/marathon.routes"));
const landing_routes_1 = __importDefault(require("./routes/landing.routes"));
const exerciseCategory_routes_1 = __importDefault(require("./routes/exerciseCategory.routes"));
const theme_routes_1 = __importDefault(require("./routes/theme.routes"));
const offer_routes_1 = __importDefault(require("./routes/offer.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const comment_admin_routes_1 = __importDefault(require("./routes/comment-admin.routes"));
const email_template_routes_1 = __importDefault(require("./routes/email-template.routes"));
const email_campaign_routes_1 = __importDefault(require("./routes/email-campaign.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
// Shop routes
const shop_routes_1 = __importDefault(require("./routes/shop.routes"));
const fortune_wheel_routes_1 = __importDefault(require("./routes/fortune-wheel.routes"));
const product_admin_routes_1 = __importDefault(require("./routes/admin/product-admin.routes"));
const order_admin_routes_1 = __importDefault(require("./routes/admin/order-admin.routes"));
const promo_code_admin_routes_1 = __importDefault(require("./routes/admin/promo-code-admin.routes"));
const category_admin_routes_1 = __importDefault(require("./routes/admin/category-admin.routes"));
const wildberries_admin_routes_1 = __importDefault(require("./routes/admin/wildberries-admin.routes"));
const fortune_wheel_admin_routes_1 = __importDefault(require("./routes/admin/fortune-wheel-admin.routes"));
const data_import_routes_1 = __importDefault(require("./routes/data-import.routes"));
// Cron jobs
const cron_jobs_1 = require("./cron-jobs");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'https://seplitza.github.io',
        'http://api-rejuvena.duckdns.org',
        'https://api-rejuvena.duckdns.org',
        'https://shop.seplitza.ru'
    ],
    credentials: true
}));
// Увеличенный лимит для загрузки фотографий (base64)
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Static files for uploads
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Serve admin panel
app.use('/admin', express_1.default.static(path_1.default.join(__dirname, '../admin-panel/dist')));
// Handle client-side routing for admin panel
app.get('/admin/*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../admin-panel/dist/index.html'));
});
// Webhook routes (must be before other routes - no auth required)
app.use('/webhooks', webhook_routes_1.default);
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/user', auth_routes_1.default); // Legacy alias for frontend compatibility
app.use('/token', auth_routes_1.default); // Old Azure API compatibility (guest login)
app.use('/api/exercises', exercise_routes_1.default);
app.use('/api/media', media_routes_1.default);
app.use('/api/tags', tag_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
app.use('/api/photo-diary', photo_diary_routes_1.default);
app.use('/api/exercise-purchase', exercise_purchase_routes_1.default);
app.use('/api/marathons', marathon_routes_1.default);
app.use('/api/landings', landing_routes_1.default);
app.use('/api/exercise-categories', exerciseCategory_routes_1.default);
app.use('/api/themes', theme_routes_1.default);
app.use('/api/offers', offer_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/comments', comment_routes_1.default);
app.use('/api/admin/comments', comment_admin_routes_1.default);
app.use('/api/admin/email-templates', email_template_routes_1.default);
app.use('/api/admin/email-campaigns', email_campaign_routes_1.default);
// Shop routes (public)
app.use('/api/shop', shop_routes_1.default);
app.use('/api/fortune-wheel', fortune_wheel_routes_1.default);
// Shop admin routes
app.use('/api/admin/products', product_admin_routes_1.default);
app.use('/api/admin/orders', order_admin_routes_1.default);
app.use('/api/admin/promo-codes', promo_code_admin_routes_1.default);
app.use('/api/admin/categories', category_admin_routes_1.default);
app.use('/api/admin/wildberries', wildberries_admin_routes_1.default);
app.use('/api/admin/fortune-wheel', fortune_wheel_admin_routes_1.default);
app.use('/api/admin/data-import', data_import_routes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        // Initialize cron jobs for shop
        (0, cron_jobs_1.initCronJobs)();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 API: http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
