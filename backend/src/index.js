import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import config from './config.js';
import { db } from './db-postgres.js';
import { ensureDefaultDevice } from './services/deviceService.js';
import authRoutes from './routes/auth.js';
import readingsRoutes from './routes/readings.js';
import analyticsRoutes from './routes/analytics.js';
import exportRoutes from './routes/export.js';
import devicesRoutes from './routes/devices.js';
import adminRoutes from './routes/admin.js';
import bus from './utils/bus.js';

const app = express();
const clients = new Set();

app.use(cors({ 
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.get('/api/stream', (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).end();
  }

  let payload;

  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).end();
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.flushHeaders?.();
  res.write(': connected\n\n');

  const client = {
    res,
    userId: payload.sub,
  };

  clients.add(client);

  req.on('close', () => {
    clients.delete(client);
  });
});

bus.on('reading:new', ({ reading, userId }) => {
  const payload = `data: ${JSON.stringify(reading)}\n\n`;

  clients.forEach((client) => {
    if (client.userId !== userId) {
      return;
    }

    try {
      client.res.write(payload);
    } catch {
      clients.delete(client);
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('[API_ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const bootstrap = async () => {
  await db.init();
  
  // Check if there are any users - if yes, system is already set up
  const userCount = await db.get('SELECT COUNT(*) as total FROM users');
  if (userCount && userCount.total > 0) {
    console.log(`Multi-user system ready with ${userCount.total} user(s)`);
  } else {
    console.log('No users found - waiting for first user registration');
  }
  
  // Ensure default device exists if there's a legacy setup
  // This is for backward compatibility with single-user setups
  const existingDevice = await db.get('SELECT * FROM devices WHERE id = $1', [config.deviceDefaultId]);
  if (existingDevice && !existingDevice.user_id) {
    // Assign orphaned device to first user if exists
    const firstUser = await db.get('SELECT id FROM users LIMIT 1');
    if (firstUser) {
      await db.run('UPDATE devices SET user_id = $1 WHERE id = $2', [firstUser.id, config.deviceDefaultId]);
      console.log(`Assigned default device to user ${firstUser.id}`);
    }
  }
  
  const server = app.listen(config.port, () => {
    console.log(`Smart Meter backend ready on http://localhost:${config.port}`);
  });

  // Graceful shutdown handler for PostgreSQL
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received: Closing server and database connections...`);
    
    // Close server to stop accepting new connections
    server.close(async () => {
      console.log('Server closed');
      
      // Close all SSE connections
      clients.forEach(client => {
        try {
          client.res.end();
        } catch (err) {
          // Ignore errors when closing connections
        }
      });
      clients.clear();
      
      // Close PostgreSQL connection pool
      try {
        await db.close();
        console.log('Database connections closed successfully');
      } catch (err) {
        console.error('Error closing database:', err);
      }
      
      console.log('Graceful shutdown complete');
      process.exit(0);
    });
    
    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle various termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
  
  // Handle Windows-specific signals
  if (process.platform === 'win32') {
    process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));
  }
  
  // Handle uncaught errors
  process.on('uncaughtException', async (err) => {
    console.error('Uncaught exception:', err);
    try {
      await db.close();
      console.log('Database closed before crash');
    } catch (closeErr) {
      console.error('Failed to close database:', closeErr);
    }
    process.exit(1);
  });
  
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    try {
      await db.close();
      console.log('Database closed after unhandled rejection');
    } catch (closeErr) {
      console.error('Failed to close database:', closeErr);
    }
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  console.error('Failed to bootstrap backend', err);
  process.exit(1);
});

