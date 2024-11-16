import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js'; // Correct named import
import checkRole from '../middlewares/checkRole.js'; // Role checking middleware

const router = express.Router();

// Public route
router.get('/public', (req, res) => {
    res.json({ message: 'This is a public route.' });
});

// Protected route: only accessible by 'admin' role
router.get('/admin', authenticateToken(['admin']), checkRole('admin'), (req, res) => {
    res.json({ message: 'Welcome to the admin dashboard.' });
});

// Default export the router
export default router;
