import express from 'express';
import multer from 'multer';
import mysql2 from 'mysql2/promise'; // Use the promise-based wrapper
import { authenticateToken } from '../middlewares/authMiddleware.js';

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

// Upload a song (logged-in artist or admin can upload songs)
router.post(
    '/albums/:albumId/songs/:artistId',
    authenticateToken(['artist', 'admin']), // Allow artists and admins
    upload.single('mp3_data'),
    async (req, res) => {
        const { artistId: loggedInArtistId, role: loggedInRole } = req.user; // Extract artistId and role from the token
        const routeArtistId = parseInt(req.params.artistId, 10); // Artist ID from the route

        // Debugging logs
        console.log('Logged-in Artist ID:', loggedInArtistId);
        console.log('Logged-in Role:', loggedInRole);
        console.log('Route Artist ID:', routeArtistId);

        // Verify that the logged-in artist matches the route artist or is an admin
        if (loggedInRole !== 'admin' && loggedInArtistId !== routeArtistId) {
            return res.status(403).json({ message: 'You do not have permission to upload songs for this artist.' });
        }

        // Prepare the SQL query and values
        const query = `
            INSERT INTO song (
                title, songimage, duration, song_releasedate, genre_type,
                song_language, file_path, mp3_data, album_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            req.body.title,
            req.body.songimage || null,
            req.body.duration || null,
            req.body.song_releasedate || null,
            req.body.genre_type || null,
            req.body.song_language || null,
            req.body.file_path || null,
            req.file?.buffer || null, // Handle optional file upload
            req.params.albumId, // Use album_id from route
        ];

        // Debugging the values being inserted
        console.log('Values to be inserted:', values);

        try {
            const [result] = await db.query(query, values);
            console.log('Song uploaded successfully, Song ID:', result.insertId);
            return res.status(201).json({ message: 'Song uploaded successfully!', song_id: result.insertId });
        } catch (err) {
            console.error('Error uploading song:', err);
            return res.status(500).json({ message: 'Error uploading song.' });
        }
    }
);

export default router;
