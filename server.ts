import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB, getDBStatus } from './server/config/db.ts';

// Load environment variables
dotenv.config();

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, 'dist');
const uploadsDir = path.resolve(rootDir, 'uploads');
const dataDir = path.resolve(rootDir, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Import routes
import authRoutes from './server/routes/authRoutes.ts';
import userRoutes from './server/routes/userRoutes.ts';
import documentRoutes from './server/routes/documentRoutes.ts';
import reviewRoutes from './server/routes/reviewRoutes.ts';
import aiRoutes from './server/routes/aiRoutes.ts';
import auditRoutes from './server/routes/auditRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import dashboardRoutes from './server/routes/dashboardRoutes.ts';

async function startServer() {
  // Connect to DB (MongoDB Atlas or built-in persistent store fallback)
  await connectDB();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // System & Health Status API
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'DocuSure – AI Document Verification & Compliance Platform',
      version: '1.0.0',
      database: getDBStatus(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Vite middleware in dev or static files in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode');
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
    console.log(`[Server] Production static files mounted from ${distDir}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DocuSure] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DocuSure] Failed to bootstrap server:', err);
  process.exit(1);
});
