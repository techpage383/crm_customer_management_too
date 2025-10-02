import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';

// New authentication system
import { createAuthRoutes } from './features/auth/auth.routes.js';
import { getAuthService } from './features/auth/auth.service.js';
import { securityHeaders, authErrorHandler } from './features/auth/auth.middleware.js';
import { Pool } from 'pg';

// User management system
import { createUserRoutes } from './features/users/user.routes.js';

// System dashboard management
import { createSystemRoutes } from './features/system/system.routes.js';

// Company management system
import companyRoutes from './features/companies/company.routes.js';

// TODO management system
import todoRoutes from './features/todos/todo.routes.js';

// Gmail integration system
import { createGmailRoutes } from './features/gmail/gmail.routes.js';

// Notification system (メール通知)
import { createNotificationRoutes } from './features/notifications/notification.routes.js';

// Workflow management system (最強タスク管理ツール)
import { createWorkflowRoutes } from './features/workflows/workflow.routes.js';

// Legacy routes (to be migrated) - temporarily disabled for Phase 2B
// import customerRoutes from './routes/customers.js';
// import threadRoutes from './routes/threads.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware (must be first)
app.use(securityHeaders());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-Token']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Initialize authentication service
const authService = getAuthService();

// Create database pool for Gmail routes
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Mount authentication routes (new system)
app.use('/api/auth', createAuthRoutes(authService));

// Mount user management routes (new system)
app.use('/api/users', createUserRoutes(authService));

// Mount system dashboard routes (new system)
app.use('/api/system', createSystemRoutes(authService));

// Mount company management routes (new system)
app.use('/api/companies', companyRoutes);

// Mount TODO management routes (new system)
app.use('/api/todos', todoRoutes);

// Mount Gmail integration routes
app.use('/api/gmail', createGmailRoutes(dbPool));

// Mount notification routes (メール通知)
app.use('/api/notifications', createNotificationRoutes(dbPool));

// Mount workflow management routes (最強タスク管理ツール) - temporarily disabled
// app.use('/api/workflows', createWorkflowRoutes(process.env.DATABASE_URL));

// Mount legacy routes (to be migrated to features-based architecture) - disabled for Phase 2B
// app.use('/api/customers', customerRoutes);
// app.use('/api/threads', threadRoutes);

// Static file serving for frontend (production only)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend-build');
  app.use(express.static(frontendPath));
  
  // Serve React app for all non-API routes (must be before 404 handler)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // Let API routes handle themselves
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 handler for API routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'エンドポイントが見つかりません',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Error handling middleware (must be last)
app.use(authErrorHandler());
app.use((error: Error, req: any, res: any, next: any) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    error: 'システムエラーが発生しました',
    code: 'SYSTEM_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Authentication: JWT + Refresh Token`);
  console.log(`🌐 CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 API Endpoints:`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
    console.log(`   Auth Status: http://localhost:${PORT}/api/auth/status`);
    console.log(`   Auth Config: http://localhost:${PORT}/api/auth/config`);
    console.log(`   Users: http://localhost:${PORT}/api/users`);
    console.log(`   User Stats: http://localhost:${PORT}/api/users/stats`);
    console.log(`   System Stats: http://localhost:${PORT}/api/system/stats`);
    console.log(`   System Health: http://localhost:${PORT}/api/system/health`);
    console.log(`   Companies: http://localhost:${PORT}/api/companies`);
    console.log(`   Company Stats: http://localhost:${PORT}/api/companies/stats`);
    console.log(`   TODOs: http://localhost:${PORT}/api/todos`);
    console.log(`   TODO Stats: http://localhost:${PORT}/api/todos/stats`);
    console.log(`   Gmail: http://localhost:${PORT}/api/gmail`);
    console.log(`   Gmail Health: http://localhost:${PORT}/api/gmail/health`);
  }
});