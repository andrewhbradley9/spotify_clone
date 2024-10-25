// server/routes/artistRoutes.js
import express from 'express';
import mysql2 from 'mysql2';
import multer from 'multer';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();


// Create a MySQL connection pool
const db = mysql2.createPool({
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,       
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 
});

// Get all artists
router.get('/', (req, res) => {
    const query = 'SELECT * FROM artist';

    db.query(query, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});
router.get('/:artistId', (req, res) => {
    const artistId = req.params.artistId; // Get artistId from request parameters
    const query = 'SELECT * FROM artist WHERE artist_id = ?';

    db.query(query, [artistId], (err, data) => { // Pass artistId as a parameter
        if (err) return res.json(err);
        return res.json(data[0]); // Return the first artist (assuming artist_id is unique)
    });
});

// Fetch album details including release date and total duration
router.get('/targetalbum/:albumId', (req, res) => {
    const albumId = req.params.albumId;

    // SQL query to get album details and calculate total duration of songs
    const query = `
        SELECT 
            a.album_name, 
            a.release_date, 
            SUM(TIME_TO_SEC(s.duration)) AS total_duration
        FROM 
            albums a
        LEFT JOIN 
            song s ON a.album_id = s.album_id
        WHERE 
            a.album_id = ?
        GROUP BY 
            a.album_id
    `;

    db.query(query, [albumId], (err, data) => {
        if (err) return res.json(err);
        return res.json(data[0]); // Return the first result since album_id is unique
    });
});


// Add artist
router.post("/", (req, res) => {
    const query = `INSERT INTO artist (artist_id, artistname, artist_bio, 
    artist_image, artist_event, awards, genre_type, follower_count, is_verified) VALUES(?)`;
    
    const values = [
        req.body.artist_id,
        req.body.artistname,
        req.body.artist_bio,
        req.body.artist_image,
        req.body.artist_event,
        req.body.awards,
        req.body.genre_type,
        req.body.follower_count,
        req.body.is_verified,
    ];

    db.query(query, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json("Artist has been created woo!");
    });
});

// Create album
router.post("/albums/:artistId", (req, res) => {
    // SQL query to insert the new album
    const query = 'INSERT INTO albums (artist_id, album_id, album_name, release_date) VALUES (?)';
    const values = [
        req.body.artist_id,
        req.body.album_id, 
        req.body.album_name, 
        req.body.release_date]; 

    db.query(query, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json("album has been created woo!");
    });
});

 
//create song into album
const upload = multer();

router.post("/albums/:albumId/songs/:artistId", upload.single('mp3_data'), async (req, res) => {
    const query = `INSERT INTO song (song_id, title, songimage, duration, song_releasedate, genre_type, album_id, song_language, file_path, mp3_data) VALUES (?)`;
    const values = [
        req.body.song_id,
        req.body.title,
        req.body.songimage,
        req.body.duration || null, // Allow duration to be null
        req.body.song_releasedate || null,
        req.body.genre_type,
        req.body.album_id,
        req.body.song_language,
        req.body.file_path || null, // Allow file_path to be null
        req.file.buffer // Access the uploaded MP3 data as a buffer
    ];

    db.query(query, [values], (err, data) => {
        if (err) {
            console.error("Error uploading song:", err);
            return res.status(500).json({ message: "Error uploading song." });
        }
        return res.json({ message: "Song uploaded successfully!", song_id: data.insertId });
    });
});


// Playing a song by id
router.get('/play/:songId', (req, res) => {
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



// Get albums by artist ID
router.get('/albums/:artistId', (req, res) => {
    const artistId = req.params.artistId;
    console.log("Artist ID:", artistId); // Log the artistId for debugging

    const query = 'SELECT * FROM albums WHERE artist_id = ?';

    db.query(query, [artistId], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error fetching albums." });
        }
        console.log("Albums data:", data); // Log the result
        return res.json(data);
    });    
});

// Route to get songs for a specific artist by artist_id and album_id
router.get('/albums/:albumId/songs/:artistId', (req, res) => {
    const { albumId, artistId } = req.params;

    const query = `
        SELECT song.*
        FROM song
        JOIN albums ON song.album_id = albums.album_id
        WHERE albums.artist_id = ? AND albums.album_id = ?
    `;

    db.query(query, [artistId, albumId], (err, results) => {
        if (err) {
            console.error('Error fetching songs:', err);
            return res.status(500).send({ message: 'Error fetching songs.' });
        }
        
        res.status(200).send(results);  // Send the retrieved songs as response
    });
});


// Delete artist
router.delete("/:id", (req, res) => {
    const artistId = req.params.id;

    // Delete associated albums if any
    db.query("DELETE FROM albums WHERE artist_id = ?", [artistId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error deleting albums." });
        }

        // Delete associated songs if any
        db.query("DELETE FROM song WHERE album_id = ?", [artistId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Error deleting songs." });
            }

            // Now delete the artist
            db.query("DELETE FROM artist WHERE artist_id = ?", [artistId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "An error occurred while deleting the artist." });
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Artist not found." });
                }
                
                return res.json({ message: "Artist and associated data have been deleted successfully!" });
            });
        });
    });
});

// Update an artist
router.put('/:id', (req, res) => {
    const artistId = req.params.id;
    const query = `UPDATE artist SET 
        artistname = COALESCE(NULLIF(?, ''), artistname), 
        artist_bio = COALESCE(NULLIF(?, ''), artist_bio), 
        artist_image = COALESCE(NULLIF(?, ''), artist_image), 
        artist_event = COALESCE(NULLIF(?, ''), artist_event), 
        awards = COALESCE(NULLIF(?, ''), awards), 
        genre_type = COALESCE(NULLIF(?, ''), genre_type), 
        follower_count = COALESCE(NULLIF(?, 0), follower_count), 
        is_verified = COALESCE(NULLIF(?, 0), is_verified) 
        WHERE artist_id = ?`;

    const values = [
        req.body.artistname,
        req.body.artist_bio,
        req.body.artist_image,
        req.body.artist_event,
        req.body.awards,
        req.body.genre_type,
        req.body.follower_count,
        req.body.is_verified,
    ];

    db.query(query, [...values, artistId], (err, data) => {
        if (err) return res.json(err);
        return res.json("Artist has been updated!");
    });
});

//get artist via name or genre
router.get('/search', async (req, res) => {
    const searchQuery = req.query.query; // Get the 'query' parameter from the URL

    if (!searchQuery) {
        return res.status(400).json({ error: "Search query is required" });
    }

    try {
        // Perform a fuzzy search on the artistname or genre_type
        const [results] = await db.query(
            `SELECT * FROM artist 
             WHERE artistname LIKE ? 
             OR genre_type LIKE ?`,
            [`%${searchQuery}%`, `%${searchQuery}%`]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: "No artists found." });
        }

        res.json(results); // Send back the search results
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to search for artists." });
    }
});

export default router;
