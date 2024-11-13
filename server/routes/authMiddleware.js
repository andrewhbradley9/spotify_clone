import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// database connection setup (if needed)
import mysql2 from 'mysql2/promise';
const db = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Define the authenticateToken middleware
export const authenticateToken = (roles = []) => (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }

        req.user = user; // Attach user info to request

        // Check if the user role is allowed to access this route
        if (roles.length && !roles.includes(user.role)) {
            return res.sendStatus(403); // Forbidden
        }

        next(); // Proceed to the next middleware/route handler
    });
};
