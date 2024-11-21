import express from 'express';
import multer from 'multer';
import mysql2 from 'mysql2/promise'; // Use the promise-based wrapper

const router = express.Router();
const upload = multer(); // For handling file uploads

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Create a MySQL connection pool using the promise wrapper
const db = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Define your user-related routes here
router.patch('/:id/deactivate', async (req, res) => {
    const userId = req.params.id;

    try {
        const [result] = await db.query(
            'UPDATE User SET account_status = ? WHERE user_id = ?',
            ['deactive', userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: `User with ID ${userId} has been deactivated successfully.` });
    } catch (err) {
        console.error('Error deactivating user:', err);
        res.status(500).json({ error: 'Failed to deactivate user.' });
    }
});

router.patch('/:id/activate', async (req, res) => {
    const userId = req.params.id;

    try {
        const [result] = await db.query(
            'UPDATE User SET account_status = ? WHERE user_id = ?',
            ['active', userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: `User with ID ${userId} has been activated successfully.` });
    } catch (err) {
        console.error('Error activating user:', err);
        res.status(500).json({ error: 'Failed to activate user.' });
    }
});


// Use default or named export
export default router; // For default export
