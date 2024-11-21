import express from 'express';
import bcrypt from 'bcrypt';
import mysql2 from 'mysql2/promise';
import jwt from 'jsonwebtoken';


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


// Register endpoint
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

        // Insert the new user into the User table
        const [result] = await db.query(
            'INSERT INTO User (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, role]
        );

        const userId = result.insertId;

        // If the user is an artist, also insert into the Artist table
        if (role === 'artist') {
            const defaultGenre = 'Unknown'; // Default genre for new artists
            await db.query(
                'INSERT INTO artist (artistname, genre_type, user_id) VALUES (?, ?, ?)',
                [username, defaultGenre, userId]
            );
        }

        // Return success message
        res.status(201).json({ 
            message: 'User registered successfully!', 
            userId: userId,
            role: role 
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});



//Login route
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
        if (user[0].account_status === 'deactive') {
            return res.status(403).json({ 
                error: 'Your account has been temporarily deactivated. Please contact support for assistance.' 
            });
        }
        // Compare the provided password with the stored hashed password
        const sanitizedPassword = password.trim();
        const match = await bcrypt.compare(sanitizedPassword, user[0].password);

        if (!match) {
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        // Fetch artist-specific details if the role is 'artist'
        let artistId = null;
        if (user[0].role === 'artist') {
            const [artist] = await db.query(
                'SELECT artist_id FROM artist WHERE user_id = ?',
                [user[0].user_id]
            );
            if (artist.length > 0) {
                artistId = artist[0].artist_id;
            }
        }

        // Generate a JWT token with user ID, role, and artist ID (if applicable)
        const token = jwt.sign(
            { id: user[0].user_id, role: user[0].role, artistId }, 
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Send the token and user details to the client
        res.json({ 
            message: 'Login successful!', 
            token, 
            role: user[0].role,
            userId: user[0].user_id,
            artistId // Include artistId for artist users
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});


export default router;
