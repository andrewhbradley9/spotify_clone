import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mysql2 from 'mysql2/promise';

dotenv.config();

const db = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export const authenticateToken = (roles = []) => async (req, res, next) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header must be in the format: Bearer <token>' });
        }

        const token = authHeader.split(' ')[1]; // Extract the token part

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
            if (err) {
                console.error('JWT Verification Error:', err);
                return res.status(403).json({ error: 'Invalid or expired token' });
            }

            req.user = user; // Attach decoded user info to the request object

            // Role-based access control
            if (roles.length && !roles.includes(user.role)) {
                return res.status(403).json({ error: 'Access denied. Insufficient role.' });
            }

            // Optionally, fetch additional user data from the database (if needed)
            const [userFromDb] = await db.query('SELECT * FROM User WHERE user_id = ?', [user.id]);
            if (userFromDb.length === 0) {
                return res.status(401).json({ error: 'User not found in database' });
            }

            next(); // Proceed to the next middleware or route handler
        });
    } catch (error) {
        console.error('Authentication Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
