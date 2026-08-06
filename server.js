// IMPORTANT: Charger dotenv EN PREMIER avant tout import
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import orderRoutes from './routes/order.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import statsRoutes from './routes/stats.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import productRoutes from './routes/product.routes.js';
import accountingRoutes from './routes/accounting.routes.js';
import expressRoutes from './routes/express.routes.js';
import stockRoutes from './routes/stock.routes.js';
import rdvRoutes from './routes/rdv.routes.js';
import deleteOrdersRoutes from './routes/delete-orders.routes.js';
import smsRoutes from './routes/sms.routes.js';
import smsSettingsRoutes from './routes/sms-settings.routes.js';
import smsTemplatesRoutes from './routes/sms-templates.routes.js';
import wasenderWebhookRoutes from './routes/wasender-webhook.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import stockAnalysisRoutes from './routes/stock-analysis.routes.js';
import { scheduleAttendanceJobs } from './jobs/attendanceJobs.js';
import { scheduleCleanupJob } from './jobs/cleanupPhotos.js';
import { scheduleMarketingRelaunchJobs } from './jobs/marketingRelaunchJobs.js';
import { scheduleExpressReminderJobs } from './jobs/expressReminderJobs.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares - CORS Configuration
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
  credentials: true,
}));

// Augmenter la limite de taille pour les requêtes (nécessaire pour upload photos base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', deleteOrdersRoutes); // 🗑️ Route de suppression (AVANT orderRoutes pour priorité)
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/express', expressRoutes);
app.use('/api/rdv', rdvRoutes);
app.use('/api/sms', smsRoutes); // 📱 Routes SMS
app.use('/api/sms-settings', smsSettingsRoutes); // ⚙️ Routes paramètres SMS
app.use('/api/sms-templates', smsTemplatesRoutes); // 📝 Routes templates SMS
app.use('/api/whatsapp/wasender', wasenderWebhookRoutes); // Statuts de livraison WaSenderAPI
app.use('/api/attendance', attendanceRoutes); // 📍 Routes pointage géolocalisé
app.use('/api/stock-analysis', stockAnalysisRoutes); // 📊 Routes analyse stock en livraison

// 📋 Jobs automatiques (présence/absence)
scheduleAttendanceJobs();

// 📣 Relances marketing des commandes annulées par un appelant
scheduleMarketingRelaunchJobs();

// Relances SMS et WhatsApp pour les colis EXPRESS en attente de retrait
scheduleExpressReminderJobs();

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API GS Pipeline - Back-office e-commerce',
    version: '1.0.0',
    status: 'running'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erreur serveur', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

