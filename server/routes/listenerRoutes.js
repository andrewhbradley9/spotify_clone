// server/routes/artistRoutes.js
import express from 'express';
import mysql2 from 'mysql2';
import multer from 'multer';


import { authenticateToken } from '../middlewares/authMiddleware.js';
import checkRole from '../middlewares/checkRole.js'; // Assuming checkRole is a middleware function for role checking

const router = express.Router();

// Create a MySQL connection pool
import dotenv from 'dotenv';
dotenv.config();




// database connection setup
const db = mysql2.createPool({
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,       
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 
});

// Playing a song by id
router.get('/play/:artistId/:songId', (req, res) => {
    const songId = req.params.songId;
    console.log(`Received request to play song with ID: ${songId}`); // Log the songId

    const query = 'SELECT mp3_data FROM song WHERE song_id = ?';
    db.query(query, [songId], (err, results) => {
        if (err) {
            console.error('Error fetching song:', err);
            return res.status(500).send('Error fetching song.');
        }

        if (results.length === 0) {
            console.log(`No song found with ID: ${songId}`); // Log if no results found
            return res.status(404).send('Song not found.');
        }

        const mp3Data = results[0].mp3_data;

        // Log the size of the MP3 data being sent
        console.log(`Sending song data of size: ${mp3Data.length} bytes`);

        // Set headers to indicate that this is an audio file
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', mp3Data.length);
        res.send(mp3Data);
    });
});