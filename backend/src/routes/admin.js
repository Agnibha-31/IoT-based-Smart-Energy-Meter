import { Router } from 'express';
import { db } from '../db-postgres.js';
import config from '../config.js';

const router = Router();

// Admin route to reset all users - DANGEROUS, use with caution
router.post('/reset-users', async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Simple admin key check (you can set this in environment variables)
    const expectedKey = process.env.ADMIN_RESET_KEY || 'RESET_KEY_CHANGE_ME';
    
    if (adminKey !== expectedKey) {
      return res.status(403).json({ error: 'Invalid admin key' });
    }
    
    // Delete all users
    await db.run('DELETE FROM users');
    await db.persist(); // Ensure changes are saved
    
    res.json({ 
      success: true, 
      message: 'All user accounts have been deleted. Application reset to first-time setup.'
    });
  } catch (error) {
    console.error('Reset users error:', error);
    res.status(500).json({ error: 'Failed to reset users', details: error.message });
  }
});

export default router;
