import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  issueToken,
  sanitizeUser,
  findUserByEmail,
  createUser,
  verifyPassword,
  updateUserProfile,
  changePassword,
  countUsers,
} from '../services/authService.js';

const router = Router();

// Check if this is the first user (for showing register vs login)
router.get(
  '/check-first-user',
  asyncHandler(async (req, res) => {
    const userCount = await countUsers();
    res.json({ isFirstUser: userCount === 0 });
  }),
);

// Check if email already exists (for real-time validation during registration)
router.post(
  '/check-email',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    const existing = await findUserByEmail(email.trim());
    res.json({ exists: !!existing });
  }),
);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    // Allow multiple users to register
    const payload = registerSchema.parse(req.body);
    const existing = await findUserByEmail(payload.email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const user = await createUser(payload);
    const token = issueToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  }),
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = issueToken(user);
    res.json({ token, user: sanitizeUser(user) });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

const preferenceSchema = z.object({
  name: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  location: z.string().optional(),
  base_tariff: z.number().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  notifications: z.record(z.boolean()).optional(),
  autosave: z.boolean().optional(),
  refresh_rate: z.number().int().positive().optional(),
  data_retention: z.enum(['7days','30days','90days','6months','1year','2years','forever']).optional(),
});

router.patch(
  '/preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updates = preferenceSchema.parse(req.body);
    const user = await updateUserProfile(req.user.id, updates);
    res.json({ user: sanitizeUser(user) });
  }),
);

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    await changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true });
  }),
);

router.delete(
  '/delete-account',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    console.log('🗑️ [DELETE ACCOUNT] Starting account deletion for user:', userId);
    
    const { db } = await import('../db.js');
    
    // Start transaction to ensure all-or-nothing deletion
    await db.transaction(async (tx) => {
      // Get all devices for this user
      const devices = await tx.all('SELECT id FROM devices WHERE user_id = ?', [userId]);
      console.log('🗑️ [DELETE ACCOUNT] Found', devices.length, 'devices');
      
      // Delete all readings for each device
      for (const device of devices) {
        await tx.run('DELETE FROM readings WHERE device_id = ?', [device.id]);
      }
      console.log('🗑️ [DELETE ACCOUNT] Deleted all readings');
      
      // Delete all exports
      await tx.run('DELETE FROM exports WHERE user_id = ?', [userId]);
      console.log('🗑️ [DELETE ACCOUNT] Deleted all exports');
      
      // Delete all devices
      await tx.run('DELETE FROM devices WHERE user_id = ?', [userId]);
      console.log('🗑️ [DELETE ACCOUNT] Deleted all devices');
      
      // Delete user account
      await tx.run('DELETE FROM users WHERE id = ?', [userId]);
      console.log('🗑️ [DELETE ACCOUNT] Deleted user account');
    });
    
    console.log('✅ [DELETE ACCOUNT] Account deletion completed successfully');
    res.json({ success: true, message: 'Account and all associated data deleted successfully' });
  }),
);

// Get user statistics (developer/admin endpoint - no auth required for monitoring)
router.get(
  '/user-stats',
  asyncHandler(async (req, res) => {
    // Add CORS headers for direct browser access
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    
    const { db } = await import('../db-postgres.js');
    
    // Get total user count
    const totalUsers = await countUsers();
    
    // Get all users with basic info (without sensitive data)
    const users = await db.all(`
      SELECT 
        id,
        email,
        name,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    // Get device count per user
    const deviceStats = await db.all(`
      SELECT 
        user_id,
        COUNT(*) as device_count
      FROM devices
      GROUP BY user_id
    `);
    
    // Create a map of user_id to device count
    const deviceMap = {};
    deviceStats.forEach(stat => {
      deviceMap[stat.user_id] = stat.device_count;
    });
    
    // Format user data
    const userList = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      devices: deviceMap[user.id] || 0,
      createdAt: new Date(user.created_at * 1000).toLocaleString(),
      updatedAt: new Date(user.updated_at * 1000).toLocaleString(),
    }));
    
    res.json({
      totalUsers,
      users: userList,
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;

