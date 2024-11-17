// server/routes/artistRoutes.js
import express from 'express';
import mysql2 from 'mysql2';
import multer from 'multer';
import cors from 'cors';

const router = express.Router();

// Add this middleware before your routes
router.use(cors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'], // Add your frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

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
    const query = `INSERT INTO artist (artistname, artist_bio, 
    artist_image, artist_event, awards, genre_type, follower_count, is_verified) VALUES(?)`;
    
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

    db.query(query, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json("Artist has been created woo!");
    });
});

// Create album
router.post("/albums/:artistId", (req, res) => {
    // SQL query to insert the new album
    const query = 'INSERT INTO albums (album_name, release_date) VALUES (?)';
    const values = [
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
    const query = `INSERT INTO song (title, songimage, duration, song_releasedate, genre_type, song_language, file_path, mp3_data) VALUES (?)`;
    const values = [
        req.body.title,
        req.body.songimage,
        req.body.duration || null, // Allow duration to be null
        req.body.song_releasedate || null,
        req.body.genre_type,
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

// Search artist
router.get('/search/artistname', (req, res) => {
    const searchTerm = req.query.term;
    if (!searchTerm) {
        return res.status(400).json({ error: 'Search term is required' });
    }

    const query = `SELECT * FROM artist WHERE artistname LIKE ?`;
    const searchValue = `%${searchTerm}%`;

    db.query(query, [searchValue], (err, results) => {
        if (err) {
            console.error('Error executing search query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(results);
    });
});

// Search songs
router.get('/search/songname', (req, res) => {
    const searchTerm = req.query.term;
    if (!searchTerm) {
        return res.status(400).json({ error: 'Search term is required' });
    }

    const query = `SELECT * FROM song WHERE title LIKE ?`;
    const searchValue = `%${searchTerm}%`;

    db.query(query, [searchValue], (err, results) => {
        if (err) {
            console.error('Error executing search query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(results);
    });
});

// GET /artists/recommendations?user_id=1 note idk if this works so feel free to fix it
router.get('/show/recommendations', (req, res) => {
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    // Query to get the user's preferences
    const getUserPreferencesQuery = `
        SELECT preferences FROM user WHERE user_id = ?;
    `;

    connection.query(getUserPreferencesQuery, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const preferences = results[0].preferences.split(','); // Assuming preferences are comma-separated

        // Query to get genres from liked songs
        const getUserLikesGenresQuery = `
            SELECT a.genre_type, ar.artistname 
            FROM likes l 
            JOIN song s ON l.song_id = s.song_id 
            JOIN artist ar ON s.artist_id = ar.artist_id 
            WHERE l.user_id = ?;
        `;

        connection.query(getUserLikesGenresQuery, [userId], (error, likedGenresResults) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            // Extract liked genres and artist names
            const likedGenres = likedGenresResults.map(result => result.genre_type);
            const likedArtists = likedGenresResults.map(result => result.artistname);

            // Combine preferences and liked genres (remove duplicates)
            const combinedGenres = [...new Set([...preferences, ...likedGenres])];

            // Query to get recommended artists based on combined genres
            const getRecommendedArtistsQuery = `
                SELECT DISTINCT ar.artist_id, ar.artistname, ar.genre_type 
                FROM artist ar 
                WHERE ar.genre_type IN (?)
            `;

            connection.query(getRecommendedArtistsQuery, [combinedGenres], (error, artists) => {
                if (error) {
                    return res.status(500).json({ error: error.message });
                }

                // Return recommendations with artist names
                return res.json({ recommendations: artists });
            });
        });
    });
});

// Follow Artist Endpoint
router.post('/user/:id/follow', (req, res) => {
    const userId = req.body.user_id;  // Assume user_id is sent in the request body
    const artistId = req.params.id;

    // SQL query to insert a new follow relationship
    const query = `
        INSERT INTO Followers (follow_date, status)
        VALUES (?, ?, NOW(), 'active')
        ON DUPLICATE KEY UPDATE status = 'active';`;  // Update if already following

    db.execute(query, [userId, artistId], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error following artist' });
        }

        // Increment the follower count in the Artists table
        const updateQuery = `
            UPDATE Artists
            SET follower_count = follower_count + 1
            WHERE artist_id = ?;`;

        db.execute(updateQuery, [artistId], (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Error updating follower count' });
            }
            res.status(200).json({ message: 'Successfully followed artist' });
        });
    });
});

// Unfollow Artist Endpoint
router.delete('/user/:id/unfollow', (req, res) => {
    const userId = req.body.user_id;  // Assume user_id is sent in the request body
    const artistId = req.params.id;

    // SQL query to delete the follow relationship
    const deleteQuery = `
        DELETE FROM Followers 
        WHERE followers_id = ? AND following_id = ?;`;

    db.execute(deleteQuery, [userId, artistId], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error unfollowing artist' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Follow relationship not found' });
        }

        // Decrement the follower count in the Artists table
        const updateQuery = `
            UPDATE Artists
            SET follower_count = follower_count - 1
            WHERE artist_id = ?;`;

        db.execute(updateQuery, [artistId], (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Error updating follower count' });
            }
            res.status(200).json({ message: 'Successfully unfollowed artist' });
        });
    });
});
// Retrieve Followed Artists Endpoint
router.get('/users/:id/followed_artists', (req, res) => {
    const userId = req.params.id;

    // SQL query to retrieve artists followed by the user
    const query = `
        SELECT a.artist_id, a.artistname, a.follower_count
        FROM Followers f
        JOIN Artists a ON f.following_id = a.artist_id
        WHERE f.followers_id = ? AND f.status = 'active';`;

    db.execute(query, [userId], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error retrieving followed artists' });
        }

        // Check if any artists are found
        if (results.length === 0) {
            return res.status(404).json({ message: 'No followed artists found' });
        }

        // Return the list of followed artists
        res.status(200).json(results);
    });
});

// Endpoint to increment play_count for a song
router.post('/songs/increment-play-count/:songId', (req, res) => {
    const { songId } = req.params;
    const query = `UPDATE song SET play_count = play_count + 1 WHERE song_id = ?`;

    db.query(query, [songId], (err, result) => {
        if (err) {
            console.error("Error updating play count:", err);
            return res.status(500).json({ error: "Error updating play count." });
        }
        res.status(200).json({ message: "Play count updated successfully." });
    });
});

router.get('/songs/top10', (req, res) => {
    console.log("Received request for top 10 songs");
    const query = `
    SELECT 
    s.song_id,
    s.title,
    s.duration,
    a.album_name,
    ar.artistname,
    s.song_releasedate,
    s.play_count
    FROM 
        song s
    JOIN 
        albums a ON s.album_id = a.album_id
    JOIN 
        artist ar ON a.artist_id = ar.artist_id
    WHERE 
        s.play_count > 0
    ORDER BY 
        s.play_count DESC
    LIMIT 10;
    `
    db.query(query, (err, data) => {
        if (err) {
            console.error("Error fetching top 10 songs:", err.code, err.message);
            return res.status(500).json({ error: "Error fetching top 10 songs." });
        }
        console.log("Fetched Data:", JSON.stringify(data, null, 2));
        res.json(data);
    });
});

// top artists
router.get('/artists/top10', (req, res) => {
    const query = `
        SELECT 
            ar.artist_id,
            ar.artistname,
            ar.artist_bio,
            ar.artist_event,
            ar.awards,
            ar.genre_type,
            ar.follower_count,
            ar.is_verified,
            SUM(s.play_count) AS total_play_count
        FROM 
            artist ar
        JOIN 
            albums a ON ar.artist_id = a.artist_id
        JOIN 
            song s ON a.album_id = s.album_id
        WHERE 
            s.play_count > 0
        GROUP BY 
            ar.artist_id, ar.artistname, ar.artist_bio, ar.artist_event, ar.awards, ar.genre_type, ar.follower_count, ar.is_verified
        ORDER BY 
            total_play_count DESC
        LIMIT 10;
    `;

    db.query(query, (err, data) => {
        if (err) {
            console.error("Error fetching top artists:", err);
            return res.status(500).json({ error: "Error fetching top artists." });
        }
        console.log("Fetched Top Artists Data:", JSON.stringify(data, null, 2));
        res.json(data);
    });
});

// Reset play count at the beginning of the month
router.put('/songs/reset-play-count', (req, res) => {
    console.log("Received request to reset play counts");

    // SQL query to reset the play_count to 0 for all songs
    const query = `
        UPDATE song
        SET play_count = 0
        WHERE play_count > 0;  -- Optional: Only reset if current play_count > 0
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error("Error resetting play counts:", err.code, err.message);
            return res.status(500).json({ error: "Error resetting play counts." });
        }
        console.log("Play counts reset successfully:", result.affectedRows);
        res.json({ message: "Play counts reset successfully", affectedRows: result.affectedRows });
    });
});

// Route to create an album with a manually entered album_id
router.post('/artist/:id/albums', (req, res) => {
    const artistId = req.params.id;
    const { album_id, album_name, release_date } = req.body;

    db.query(
        'SELECT * FROM artist WHERE artist_id = ?', [artistId],
        (err, artistResult) => {
            if (err) {
                console.error("Database query failed:", err); // Log error
                return res.status(500).json({ error: 'Database query failed' });
            }

            if (artistResult.length === 0) {
                console.log("Artist not found:", artistId); // Log missing artist
                return res.status(404).json({ message: 'Artist not found, cannot add album' });
            }

            // Insert the album with the manually entered album_id
            db.query(
                'INSERT INTO albums (album_id, artist_id, album_name, release_date) VALUES (?, ?, ?, ?)',
                [album_id, artistId, album_name, release_date],
                (err, result) => {
                    if (err) {
                        console.error("Failed to add album:", err); // Log insertion error
                        return res.status(500).json({ error: 'Failed to add album' });
                    }
                    res.status(201).json({ message: 'Album added successfully', albumId: result.insertId });
                }
            );
        }
    );
});



router.delete('/albums/:id', (req, res) => {
    const albumId = req.params.id;

    db.query(
        'SELECT * FROM albums WHERE album_id = ?', [albumId], // Corrected here
        (err, albumResult) => {
            if (err) {
                return res.status(500).json({ error: 'Database query failed' });
            }

            if (albumResult.length === 0) {
                return res.status(404).json({ message: 'Album not found, cannot delete' });
            }

            db.query(
                'DELETE FROM albums WHERE album_id = ?', [albumId],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to delete album' });
                    }
                    res.status(200).json({ message: 'Album deleted successfully' });
                }
            );
        }
    );
});

// Change begin: Update artist route to handle image upload
/*router.post('/artists', upload.single('artist_image'), (req, res) => {
    const artistData = {
        ...req.body,
        artist_image: req.file ? `/uploads/${req.file.filename}` : null
    };
    // ... rest of your artist creation logic
});

// Update album route to handle image upload
router.post('/artist/:id/albums', upload.single('album_image'), (req, res) => {
    const albumData = {
        ...req.body,
        album_image: req.file ? `/uploads/${req.file.filename}` : null
    };
    // ... rest of your album creation logic
});
//change end*/

// Add new route to get recent platform activity
router.get('/activity/recent', async (req, res) => {
    try {
        const filter = req.query.filter || 'all';
        let dateFilter = {};
        
        const now = new Date();
        
        switch(filter) {
            case 'day':
                dateFilter = { date: { $gte: new Date(now - 24*60*60*1000) } };
                break;
            case 'week':
                dateFilter = { date: { $gte: new Date(now - 7*24*60*60*1000) } };
                break;
            case 'month':
                dateFilter = { date: { $gte: new Date(now - 30*24*60*60*1000) } };
                break;
            default:
                dateFilter = {};
        }

        const activities = await Activity.find(dateFilter).sort({ date: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get artist by ID with detailed information
router.get('/artist/:id', (req, res) => {
    const artistId = req.params.id;
    
    // Query to get artist details including albums and songs
    const query = `
        SELECT 
            a.*,
            alb.album_id,
            alb.album_name,
            alb.release_date,
            s.song_id,
            s.title as song_title,
            s.duration,
            s.play_count as total_play_count,
            (SELECT COUNT(*) FROM likes WHERE song_id = s.song_id) as total_likes
        FROM artist a
        LEFT JOIN albums alb ON a.artist_id = alb.artist_id
        LEFT JOIN song s ON alb.album_id = s.album_id
        WHERE a.artist_id = ?
    `;

    db.query(query, [artistId], (err, results) => {
        if (err) {
            console.error("Error fetching artist details:", err);
            return res.status(500).json({ error: "Error fetching artist details" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Artist not found" });
        }

        // Restructure the data
        const artist = {
            artist_id: results[0].artist_id,
            artistname: results[0].artistname,
            artist_bio: results[0].artist_bio,
            artist_image: results[0].artist_image,
            artist_event: results[0].artist_event,
            awards: results[0].awards,
            genre_type: results[0].genre_type,
            follower_count: results[0].follower_count,
            is_verified: results[0].is_verified,
            albums: []
        };

        // Group songs by album
        const albumMap = new Map();
        
        results.forEach(row => {
            if (row.album_id) {
                if (!albumMap.has(row.album_id)) {
                    albumMap.set(row.album_id, {
                        album_id: row.album_id,
                        album_name: row.album_name,
                        release_date: row.release_date,
                        songs: []
                    });
                }
                
                if (row.song_id) {
                    albumMap.get(row.album_id).songs.push({
                        song_id: row.song_id,
                        song_title: row.song_title,
                        duration: row.duration,
                        total_play_count: row.total_play_count,
                        total_likes: row.total_likes
                    });
                }
            }
        });

        artist.albums = Array.from(albumMap.values());
        res.json(artist);
    });
});

export default router;
