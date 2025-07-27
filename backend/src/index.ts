import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// New authentication system
import { createAuthRoutes } from './features/auth/auth.routes.js';
import { getAuthService } from './features/auth/auth.service.js';
import { securityHeaders, authErrorHandler } from './features/auth/auth.middleware.js';

// Legacy routes (to be migrated) - temporarily disabled for Phase 2B
// import customerRoutes from './routes/customers.js';
// import gmailRoutes from './routes/gmail.js';
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

// Mount authentication routes (new system)
app.use('/api/auth', createAuthRoutes(authService));

// Mount legacy routes (to be migrated to features-based architecture) - disabled for Phase 2B
// app.use('/api/customers', customerRoutes);
// app.use('/api/gmail', gmailRoutes);
// app.use('/api/threads', threadRoutes);

// 404 handler
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
  }
});