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

// routes/songRoutes.js
router.get('/flagged', authenticateToken(['admin']), async (req, res) => {
    try {
        const [flaggedSongs] = await db.query(`
            SELECT song_id, title, genre_type, flagged, play_count, likes
            FROM song
            WHERE flagged = TRUE
        `);
        res.status(200).json(flaggedSongs);
    } catch (err) {
        console.error('Error fetching flagged songs:', err);
        res.status(500).json({ message: 'Failed to fetch flagged songs.' });
    }
});


// Delete a song
router.delete('/:songId', authenticateToken(['admin']), async (req, res) => {
    const { songId } = req.params;

    try {
        // Debugging logs
        console.log('Admin is attempting to delete song:', songId);

        // Check if the song exists
        const [song] = await db.query(`SELECT * FROM song WHERE song_id = ?`, [songId]);
        if (song.length === 0) {
            return res.status(404).json({ message: 'Song not found.' });
        }

        // Proceed to delete the song
        await db.query(`DELETE FROM song WHERE song_id = ?`, [songId]);
        res.status(200).json({ message: 'Song deleted successfully.' });
    } catch (err) {
        console.error('Error deleting song:', err.message, err.stack);
        res.status(500).json({ message: 'Failed to delete song.' });
    }
});



// Report a song
router.post('/report/:songId', authenticateToken(), async (req, res) => {
    const { songId } = req.params;
    const userId = req.user.id; // Assuming user ID is available from the token

    try {
        // Prevent duplicate reports by the same user for the same song
        const [existingReport] = await db.query(
            `SELECT * FROM Reports WHERE song_id = ? AND user_id = ?`,
            [songId, userId]
        );
        if (existingReport.length > 0) {
            return res.status(400).json({ message: 'You have already reported this song.' });
        }

        // Insert a new report
        const query = `
            INSERT INTO Reports (song_id, user_id, report_date)
            VALUES (?, ?, NOW());
        `;
        await db.query(query, [songId, userId]);
        res.status(201).json({ message: 'Song reported successfully.' });
    } catch (err) {
        console.error('Error reporting song:', err);
        res.status(500).json({ message: 'Failed to report song.' });
    }
});


// Like a song
router.post('/like/:songId', authenticateToken(), async (req, res) => {
    const { songId } = req.params;
    const userId = req.user.id; // Assuming user ID is available from the token

    try {
        // Check if the song is already liked
        const [existingLike] = await db.query(
            `SELECT * FROM Likes WHERE user_id = ? AND song_id = ?`,
            [userId, songId]
        );
        if (existingLike.length > 0) {
            return res.status(400).json({ message: 'You have already liked this song.' });
        }

        // Add a like
        const query = `
            INSERT INTO Likes (user_id, song_id)
            VALUES (?, ?)
        `;
        await db.query(query, [userId, songId]);

        // Optionally, increment the song's like count
        await db.query(`UPDATE song SET likes = likes + 1 WHERE song_id = ?`, [songId]);

        res.status(201).json({ message: 'Song liked successfully.' });
    } catch (err) {
        console.error('Error liking song:', err);
        res.status(500).json({ message: 'Failed to like song.' });
    }
});

// Unlike a song
router.delete('/like/:songId', authenticateToken(), async (req, res) => {
    const { songId } = req.params;
    const userId = req.user.id;

    try {
        // Check if the song is already liked
        const [existingLike] = await db.query(
            `SELECT * FROM Likes WHERE user_id = ? AND song_id = ?`,
            [userId, songId]
        );
        if (existingLike.length === 0) {
            return res.status(400).json({ message: 'You have not liked this song.' });
        }

        // Remove the like
        const query = `
            DELETE FROM Likes WHERE user_id = ? AND song_id = ?
        `;
        await db.query(query, [userId, songId]);

        // Optionally, decrement the song's like count
        await db.query(`UPDATE song SET likes = likes - 1 WHERE song_id = ?`, [songId]);

        res.status(200).json({ message: 'Song unliked successfully.' });
    } catch (err) {
        console.error('Error unliking song:', err);
        res.status(500).json({ message: 'Failed to unlike song.' });
    }
});

router.get('/likes', authenticateToken(), async (req, res) => {
    const userId = req.user.id;

    try {
        const [likes] = await db.query(`SELECT song_id FROM Likes WHERE user_id = ?`, [userId]);
        res.status(200).json(likes);
    } catch (err) {
        console.error('Error fetching liked songs:', err);
        res.status(500).json({ message: 'Failed to fetch liked songs.' });
    }
});


export default router;
