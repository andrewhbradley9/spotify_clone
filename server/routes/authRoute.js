import express from 'express';
import bcrypt from 'bcrypt';
import mysql2 from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './authMiddleware.js';
import checkRole from './checkRole.js';


const router = express.Router();


import dotenv from 'dotenv';
dotenv.config();

// database connection setup
const db = mysql2.createPool({
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,       
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 
});



// Example: Protect an artist-only route
router.get('/artist-only', authenticateToken(['artist']), (req, res) => {
    res.json({ message: 'Welcome, artist!' });
});

// Example: Protect an admin-only route
router.get('/admin-only', authenticateToken(['admin']), (req, res) => {
    res.json({ message: 'Welcome, admin!' });
});

router.get('/listener-only', authenticateToken(['listener']), (req, res) => {
    res.json({ message: 'Welcome, listener!' });
});

// Register endpoint
router.post('/register', async (req, res) => {
    const { username, password, email, role } = req.body;

    // Validate required fields
    if (!username || !password || !email || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate role
    const allowedRoles = ['listener', 'artist', 'admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified.' });
    }

    try {
        // Check if the username or email already exists
        const [existingUser] = await db.query(
            'SELECT * FROM User WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'Username or email already in use.' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // console.log(hashedPassword)

        // Insert the new user into the database
        const [result] = await db.query(
            'INSERT INTO User (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, role]
        );

        // Return success message
        res.status(201).json({ message: 'User registered successfully!', 
            userId: result.insertId,
            role: role 
        });
    
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // Find the user by username
        const [user] = await db.query(
            'SELECT * FROM User WHERE username = ?',
            [username]
        );

        // Check if the user exists
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Compare the provided password with the stored hashed password
        
        const sanitizedPassword = password.trim();
        const match = await bcrypt.compare(sanitizedPassword, user[0].password);
        

        if (!match) {
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { userId: user[0].user_id, role: user[0].role }, // Payload
            process.env.JWT_SECRET, // Secret key from environment variables
            { expiresIn: '1h' } // Token expiration time
        );

        // Send the token to the client
        res.json({ message: 'Login successful!', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

export default router;
