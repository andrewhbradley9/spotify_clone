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
        console.log('Starting authentication middleware...');
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        console.log('Authorization Header:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Authorization header missing or incorrect format.');
            return res.status(401).json({ error: 'Authorization header must be in the format: Bearer <token>' });
        }

        const token = authHeader.split(' ')[1]; // Extract the token part
        console.log('Extracted Token:', token);

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
            if (err) {
                console.error('JWT Verification Error:', err);
                return res.status(403).json({ error: 'Invalid or expired token' });
            }

            console.log('Decoded User:', user);
            req.user = user; // Attach decoded user info to the request object

            // Role-based access control
            if (roles.length && !roles.includes(user.role)) {
                console.error('Access denied for role:', user.role);
                return res.status(403).json({ error: 'Access denied. Insufficient role.' });
            }

            // Optional: Fetch additional user data from the database
            console.log('Fetching user from the database...');
            const [userFromDb] = await db.query('SELECT * FROM User WHERE user_id = ?', [user.id]);
            console.log('User fetched from DB:', userFromDb);

            if (userFromDb.length === 0) {
                console.error('User not found in the database.');
                return res.status(401).json({ error: 'User not found in database' });
            }

            console.log('User authentication successful. Proceeding to next middleware/handler...');
            next(); // Proceed to the next middleware or route handler
        });
    } catch (error) {
        console.error('Authentication Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
