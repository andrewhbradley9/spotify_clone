// server/routes/artistRoutes.js
import express from 'express';
import mysql2 from 'mysql2';
import multer from 'multer';

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
        SELECT *
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

// // Follow Artist Endpoint
// router.post('/user/:id/follow', (req, res) => {
//     const userId = req.body.user_id;  // Assume user_id is sent in the request body
//     const artistId = req.params.id;

//     // SQL query to insert a new follow relationship
//     const query = `
//         INSERT INTO Followers (follow_date, status)
//         VALUES (?, ?, NOW(), 'active')
//         ON DUPLICATE KEY UPDATE status = 'active';`;  // Update if already following

//     db.execute(query, [userId, artistId], (error, results) => {
//         if (error) {
//             console.error(error);
//             return res.status(500).json({ message: 'Error following artist' });
//         }

//         // Increment the follower count in the Artists table
//         const updateQuery = `
//             UPDATE Artists
//             SET follower_count = follower_count + 1
//             WHERE artist_id = ?;`;

//         db.execute(updateQuery, [artistId], (error) => {
//             if (error) {
//                 console.error(error);
//                 return res.status(500).json({ message: 'Error updating follower count' });
//             }
//             res.status(200).json({ message: 'Successfully followed artist' });
//         });
//     });
// });

// // Unfollow Artist Endpoint
// router.delete('/user/:id/unfollow', (req, res) => {
//     const userId = req.body.user_id;  // Assume user_id is sent in the request body
//     const artistId = req.params.id;

//     // SQL query to delete the follow relationship
//     const deleteQuery = `
//         DELETE FROM Followers 
//         WHERE followers_id = ? AND following_id = ?;`;

//     db.execute(deleteQuery, [userId, artistId], (error, results) => {
//         if (error) {
//             console.error(error);
//             return res.status(500).json({ message: 'Error unfollowing artist' });
//         }
        
//         if (results.affectedRows === 0) {
//             return res.status(404).json({ message: 'Follow relationship not found' });
//         }

//         // Decrement the follower count in the Artists table
//         const updateQuery = `
//             UPDATE Artists
//             SET follower_count = follower_count - 1
//             WHERE artist_id = ?;`;

//         db.execute(updateQuery, [artistId], (error) => {
//             if (error) {
//                 console.error(error);
//                 return res.status(500).json({ message: 'Error updating follower count' });
//             }
//             res.status(200).json({ message: 'Successfully unfollowed artist' });
//         });
//     });
// });
// // Retrieve Followed Artists Endpoint
// router.get('/users/:id/followed_artists', (req, res) => {
//     const userId = req.params.id;

//     // SQL query to retrieve artists followed by the user
//     const query = `
//         SELECT a.artist_id, a.artistname, a.follower_count
//         FROM Followers f
//         JOIN Artists a ON f.following_id = a.artist_id
//         WHERE f.followers_id = ? AND f.status = 'active';`;

//     db.execute(query, [userId], (error, results) => {
//         if (error) {
//             console.error(error);
//             return res.status(500).json({ message: 'Error retrieving followed artists' });
//         }

//         // Check if any artists are found
//         if (results.length === 0) {
//             return res.status(404).json({ message: 'No followed artists found' });
//         }

//         // Return the list of followed artists
//         res.status(200).json(results);
//     });
// });

// Endpoint to increment play_count for a song
router.post('/songs/increment-play-count/:songId', async (req, res) => {
    const { songId } = req.params;
    console.log(`Received request to increment play count for songId: ${songId}`);

    try {
        // Increment play count in the song table
        const updateSongQuery = `UPDATE song SET play_count = play_count + 1 WHERE song_id = ?`;
        await db.promise().query(updateSongQuery, [songId]);

        // Insert a record in play_history with the updated play count
        const insertHistoryQuery = `
            INSERT INTO play_history (song_id, total_play_count, play_date) 
            VALUES (?, (SELECT play_count FROM song WHERE song_id = ?), CURRENT_TIMESTAMP)
        `;
        await db.promise().query(insertHistoryQuery, [songId, songId]);

        console.log("Play count and play history updated successfully.");
        res.status(200).json({ message: "Play count and play history updated successfully." });
    } catch (err) {
        console.error("Error processing play count update and history log:", err);
        res.status(500).json({ error: "Failed to process request.", details: err.message });
    }
});

router.get('/songs/top10', (req, res) => {
    const { start_date, end_date, limit = 10, sortOrder = 'most', dateRangeOption } = req.query;
    const orderDirection = sortOrder === 'least' ? 'ASC' : 'DESC';

    let query;
    let queryParams;

    if (dateRangeOption === "currentMonth") {
        query = `
        SELECT DISTINCT
            s.song_id,
            s.title,
            s.duration,
            COALESCE(a.album_name, 'Unknown Album') AS album_name,
            ar.artistname,
            s.song_releasedate,
            COALESCE(s.play_count, 0) AS play_count,
            COALESCE(s.likes, 0) AS likes
        FROM 
            song s
        LEFT JOIN 
            albums a ON s.album_id = a.album_id
        LEFT JOIN 
            artist ar ON a.artist_id = ar.artist_id
        LEFT JOIN 
            play_history ph ON s.song_id = ph.song_id
        ORDER BY 
            play_count ${orderDirection}, likes ${orderDirection}
        LIMIT ?;
        `;
        queryParams = [parseInt(limit)];
    } else {
        query = `
        SELECT DISTINCT
            s.song_id,
            s.title,
            s.duration,
            COALESCE(a.album_name, 'Unknown Album') AS album_name,
            ar.artistname,
            s.song_releasedate,
            COALESCE(COUNT(l.like_date), 0) AS total_likes,
            COALESCE(ph_on_last_date.total_play_count, 0) AS total_play_count
        FROM 
            song s
        LEFT JOIN 
            albums a ON s.album_id = a.album_id
        LEFT JOIN 
            artist ar ON a.artist_id = ar.artist_id
        LEFT JOIN 
            (
                SELECT ph.song_id, ph.total_play_count, ph.play_date
                FROM play_history ph
                INNER JOIN (
                    SELECT song_id, MAX(play_date) AS last_play_date
                    FROM play_history
                    WHERE play_date BETWEEN ? AND ?
                    GROUP BY song_id
                ) AS last_play ON ph.song_id = last_play.song_id AND ph.play_date = last_play.last_play_date
            ) AS ph_on_last_date ON s.song_id = ph_on_last_date.song_id
        LEFT JOIN 
            likes l ON s.song_id = l.song_id AND l.like_date BETWEEN ? AND ?
        GROUP BY 
            s.song_id, s.title, s.duration, album_name, ar.artistname, s.song_releasedate
        ORDER BY 
            total_play_count ${orderDirection}, total_likes ${orderDirection}
        LIMIT ?;
        `;
        queryParams = [start_date, end_date, start_date, end_date, parseInt(limit)];
    }

    db.query(query, queryParams, (err, data) => {
        if (err) {
            console.error("Error fetching top songs:", err.code, err.message);
            return res.status(500).json({ error: "Error fetching top songs." });
        }
        console.log("Fetched Data:", JSON.stringify(data, null, 2));
        res.json(data);
    });
});


// top artists
router.get('/artists/top10', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const { start_date, end_date, sortOrder = 'most' } = req.query;
    const orderDirection = sortOrder === 'least' ? 'ASC' : 'DESC';

    let query;
    let queryParams;

    if (start_date && end_date) {
        query = `
        SELECT artist_id, artistname, artist_bio, artist_event, awards, genre_type, follower_count, is_verified,
               title AS most_played_song_title, total_play_count, total_likes, total_popularity_score
        FROM (
            SELECT 
                ar.artist_id,
                ar.artistname,
                ar.artist_bio,
                ar.artist_event,
                ar.awards,
                ar.genre_type,
                ar.follower_count,
                ar.is_verified,
                s.title,
                COALESCE(ph_on_last_date.total_play_count, 0) AS total_play_count,
                COALESCE(COUNT(l.like_date), 0) AS total_likes,
                (COALESCE(ph_on_last_date.total_play_count, 0) + COALESCE(COUNT(l.like_date), 0)) AS total_popularity_score,
                ROW_NUMBER() OVER (PARTITION BY ar.artist_id ORDER BY (COALESCE(ph_on_last_date.total_play_count, 0) + COALESCE(COUNT(l.like_date), 0)) ${orderDirection}) AS \`rank\`
            FROM 
                artist ar
            JOIN 
                albums a ON ar.artist_id = a.artist_id
            JOIN 
                song s ON a.album_id = s.album_id
            LEFT JOIN 
                (
                    SELECT ph.song_id, ph.total_play_count
                    FROM play_history ph
                    INNER JOIN (
                        SELECT song_id, MAX(play_date) AS last_play_date
                        FROM play_history
                        WHERE play_date BETWEEN ? AND ?
                        GROUP BY song_id
                    ) AS last_play ON ph.song_id = last_play.song_id AND ph.play_date = last_play.last_play_date
                ) AS ph_on_last_date ON s.song_id = ph_on_last_date.song_id
            LEFT JOIN 
                likes l ON s.song_id = l.song_id AND l.like_date BETWEEN ? AND ?
            GROUP BY 
                ar.artist_id, ar.artistname, ar.artist_bio, ar.artist_event, ar.awards, ar.genre_type, ar.follower_count, 
                ar.is_verified, s.title, ph_on_last_date.total_play_count
        ) AS ranked_songs
        WHERE \`rank\` = 1
        ORDER BY total_popularity_score ${orderDirection}
        LIMIT ?;
        `;

        queryParams = [start_date, end_date, start_date, end_date, limit];
    } else {
        query = `
        SELECT artist_id, artistname, artist_bio, artist_event, awards, genre_type, follower_count, is_verified,
               title AS most_played_song_title, total_play_count, total_likes, total_popularity_score
        FROM (
            SELECT 
                ar.artist_id,
                ar.artistname,
                ar.artist_bio,
                ar.artist_event,
                ar.awards,
                ar.genre_type,
                ar.follower_count,
                ar.is_verified,
                s.title,
                s.play_count AS total_play_count,
                s.likes AS total_likes,
                (s.play_count + s.likes) AS total_popularity_score,
                ROW_NUMBER() OVER (PARTITION BY ar.artist_id ORDER BY (s.play_count + s.likes) ${orderDirection}) AS \`rank\`
            FROM 
                artist ar
            JOIN 
                albums a ON ar.artist_id = a.artist_id
            JOIN 
                song s ON a.album_id = s.album_id
            WHERE s.play_count + s.likes > 0
        ) AS ranked_songs
        WHERE \`rank\` = 1
        ORDER BY total_popularity_score ${orderDirection}
        LIMIT ?;
        `;

        queryParams = [limit];
    }

    db.query(query, queryParams, (err, data) => {
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

/// Get total likes for an artist
router.get('/:artistId/totalLikes', (req, res) => {
    const artistId = req.params.artistId;

    // SQL query to count total likes for an artist's songs
    const query = `
        SELECT COUNT(likes.like_id) AS totalLikes
        FROM likes
        INNER JOIN song ON likes.Song_id = song.song_id
        INNER JOIN albums ON song.album_id = albums.album_id
        WHERE albums.artist_id = ?`;

    // Execute the query
    db.query(query, [artistId], (err, results) => {
        if (err) {
            console.error('Error executing total likes query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Check if results are returned
        if (results.length > 0) {
            res.json({ totalLikes: results[0].totalLikes });
        } else {
            res.json({ totalLikes: 0 }); // No likes found for the artist
        }
    });
});

router.post("/songs/:songId/like", (req, res) => {
    const { songId } = req.params;
    const userId = req.body.user_id; // get user_id from request body for tracking

    // Check if the user has already liked the song
    const checkQuery = `SELECT * FROM likes WHERE User_id = ? AND Song_id = ?`;
    db.query(checkQuery, [userId, songId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error while checking likes." });

        if (results.length > 0) {
            // User has already liked the song, so we perform an "unlike" operation
            const deleteLike = `DELETE FROM likes WHERE User_id = ? AND Song_id = ?`;
            db.query(deleteLike, [userId, songId], (err) => {
                if (err) return res.status(500).json({ error: "Database error while removing like." });

                // Decrement like_count in the song table
                const decrementQuery = `UPDATE song SET likes = likes - 1 WHERE song_id = ?`;
                db.query(decrementQuery, [songId], (err) => {
                    if (err) return res.status(500).json({ error: "Database error while updating like count." });
                    res.json({ message: "Song unliked successfully!" });
                });
            });
        } else {
            // User has not liked the song, so we proceed with a "like" operation
            const insertLike = `INSERT INTO likes (User_id, Song_id) VALUES (?, ?)`;
            db.query(insertLike, [userId, songId], (err) => {
                if (err) return res.status(500).json({ error: "Database error while inserting like." });

                // Increment like_count in the song table
                const incrementQuery = `UPDATE song SET likes = likes + 1 WHERE song_id = ?`;
                db.query(incrementQuery, [songId], (err) => {
                    if (err) return res.status(500).json({ error: "Database error while updating like count." });
                    res.json({ message: "Song liked successfully!" });
                });
            });
        }
    });
});

// Get a song's likes by song_id
router.get('/song-likes/:song_id', (req, res) => {
    const songId = req.params.song_id;
  
    // SQL query to get song likes
    const query = `
      SELECT song.likes
      FROM song
      JOIN albums ON song.album_id = albums.album_id
      JOIN artist ON albums.artist_id = artist.artist_id
      WHERE song.song_id = ?;
    `;
  
    // Execute query with songId as parameter
    db.execute(query, [songId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
  
      if (results.length > 0) {
        // Return the song's details if found
        res.json(results[0]);
      } else {
        // If no song found
        res.status(404).json({ message: 'Song not found' });
      }
    });
  });

  router.get('/most-played/genres', (req, res) => {
    const { start_date, end_date } = req.query;

    let query;
    let queryParams = [];

    if (start_date && end_date) {
        // Query when a specific month (date range) is selected, using play_history.total_play_count
        query = `
        SELECT genre.genre_type, COALESCE(SUM(ph_on_last_date.total_play_count), 0) AS total_play_count
        FROM genre
        LEFT JOIN song ON genre.genre_type = song.genre_type
        LEFT JOIN (
            SELECT ph.song_id, ph.total_play_count
            FROM play_history ph
            INNER JOIN (
                SELECT song_id, MAX(play_date) AS last_play_date
                FROM play_history
                WHERE play_date BETWEEN ? AND ?
                GROUP BY song_id
            ) AS last_play ON ph.song_id = last_play.song_id AND ph.play_date = last_play.last_play_date
        ) AS ph_on_last_date ON song.song_id = ph_on_last_date.song_id
        GROUP BY genre.genre_type
        ORDER BY total_play_count DESC;
        `;
        queryParams = [start_date, end_date];
    } else {
        // Default query using song.play_count when no date range is selected
        query = `
        SELECT genre.genre_type, COALESCE(SUM(song.play_count), 0) AS total_play_count
        FROM genre
        LEFT JOIN song ON genre.genre_type = song.genre_type
        GROUP BY genre.genre_type
        ORDER BY total_play_count DESC;
        `;
    }

    // Execute the query with the appropriate parameters
    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching most played genres:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
        }
    });
});

  
router.get('/all/users', (req, res) => {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!endDate) {
        return res.status(400).json({ error: "Please provide 'endDate' in 'YYYY-MM-DD' format." });
    }

    // Define query and parameters
    let query;
    const params = startDate
        ? [startDate, endDate]
        : [endDate];

    if (startDate) {
        // Query for users within a specific date range
        query = `
            SELECT 
                u.user_id, 
                u.username, 
                u.created_at, 
                u.role, 
                u.subscription_date, 
                u.email, 
                a.artist_id,
                a.artistname,
                COUNT(u.user_id) AS total_users,
                MAX(u.user_id) AS last_user_id
            FROM User u
            LEFT JOIN artist a ON u.user_id = a.user_id
            WHERE u.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
            GROUP BY u.user_id, u.username, u.created_at, u.role, u.subscription_date, u.email, a.artist_id
        `;
    } else {
        // Query for all users up to the specified endDate
        query = `
            SELECT 
                u.user_id, 
                u.username, 
                u.created_at, 
                u.role, 
                u.subscription_date, 
                u.email, 
                a.artist_id,
                a.artistname,
                COUNT(u.user_id) AS total_users_up_to_date
            FROM User u
            LEFT JOIN artist a ON u.user_id = a.user_id
            WHERE u.created_at <= DATE_ADD(?, INTERVAL 1 DAY)
            GROUP BY u.user_id, u.username, u.created_at, u.role, u.subscription_date, u.email, a.artist_id
        `;
    }

    // Execute the query
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Structure the response based on query type
        const response = startDate
            ? {
                startDate,
                endDate,
                total_users: results.length,
                users: results.map(user => ({
                    user_id: user.user_id,
                    username: user.username,
                    created_at: user.created_at,
                    role: user.role,
                    subscription_date: user.subscription_date,
                    email: user.email,
                    artist_id: user.artist_id || null, // Include artist_id, if available
                })),
                last_user_id: results[0]?.last_user_id || null,
            }
            : {
                total_users_up_to_date: results.length,
                users: results.map(user => ({
                    user_id: user.user_id,
                    username: user.username,
                    created_at: user.created_at,
                    role: user.role,
                    subscription_date: user.subscription_date,
                    email: user.email,
                    artist_id: user.artist_id || null, // Include artist_id, if available
                })),
            };

        res.json(response);
    });
});


router.get('/all/subscribers', (req, res) => {
    const { startDate, endDate, mode } = req.query;

    if (!endDate) {
        return res.status(400).json({ error: "Please provide endDate in 'YYYY-MM-DD' format." });
    }

    const baseQuery = `
        SELECT COUNT(u.user_id) AS total_users_up_to_date
        FROM User u
    `;

    db.query(baseQuery, [endDate], (err, userCountResults) => {
        if (err) {
            console.error('Error checking user existence:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const totalUsers = userCountResults[0]?.total_users_up_to_date || 0;

        if (totalUsers === 0) {
            return res.json({
                total_active_subscribers: 0,
                active_subscribers: 0,
                inactive_subscribers: 0,
                new_active_subscribers: 0,
                users: [],
                inactive_users: [],
            });
        }

        // Handle cumulative query mode
        if (mode === 'cumulative') {
            const cumulativeQuery = `
                SELECT 
                    u.user_id, u.username, u.email, u.created_at, u.subscription_date, u.role,
                    a.artist_id, a.artistname
                FROM User u
                LEFT JOIN artist a ON u.user_id = a.user_id
                WHERE u.subscription_status = 'active' AND u.subscription_date <= ?
            `;

            return db.query(cumulativeQuery, [endDate], (err, results) => {
                if (err) {
                    console.error('Error fetching cumulative active subscribers:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                res.json({
                    total_active_subscribers: results.length,
                    new_active_subscribers: 0,
                    users: results,
                });
            });
        }

        // Handle inactive query mode
        if (mode === 'inactive') {
            const inactiveQuery = `
                SELECT 
                    u.user_id, u.username, u.email, u.created_at, u.subscription_date, u.role,
                    a.artist_id, a.artistname
                FROM User u
                LEFT JOIN artist a ON u.user_id = a.user_id
                WHERE u.subscription_status = 'inactive' OR (u.subscription_status = 'active' AND u.subscription_date > ?)
            `;

            return db.query(inactiveQuery, [endDate], (err, results) => {
                if (err) {
                    console.error('Error fetching inactive subscribers:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                res.json({
                    inactive_subscribers: results,
                });
            });
        }

        // Validate range queries require both startDate and endDate
        if (!startDate) {
            return res.status(400).json({ error: "Please provide both startDate and endDate for range-based queries." });
        }

        // Query for active/inactive counts in the range
        const rangeQuery = `
            SELECT 
                SUM(u.subscription_status = 'active' AND u.subscription_date BETWEEN ? AND ?) AS active_subscribers,
                SUM(u.subscription_status = 'inactive' OR (u.subscription_status = 'active' AND u.subscription_date > ?)) AS inactive_subscribers
            FROM User u
        `;

        // Query for new active subscribers in the range
        const newActiveQuery = `
            SELECT 
                u.user_id, u.username, u.email, u.created_at, u.subscription_date, u.role,
                a.artist_id, a.artistname
            FROM User u
            LEFT JOIN artist a ON u.user_id = a.user_id
            WHERE u.subscription_status = 'active' AND u.subscription_date BETWEEN ? AND ?
        `;

        // Query for inactive user details in the range
        const inactiveQuery = `
            SELECT 
                u.user_id, u.username, u.email, u.created_at, u.subscription_date, u.role,
                a.artist_id, a.artistname
            FROM User u
            LEFT JOIN artist a ON u.user_id = a.user_id
            WHERE u.subscription_status = 'inactive' OR (u.subscription_status = 'active' AND u.subscription_date > ?)
        `;

        // Execute range queries
        db.query(rangeQuery, [startDate, endDate, endDate], (err, rangeResults) => {
            if (err) {
                console.error('Error fetching subscribers:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            db.query(newActiveQuery, [startDate, endDate], (err, newActiveResults) => {
                if (err) {
                    console.error('Error fetching new active subscribers:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                db.query(inactiveQuery, [endDate], (err, inactiveResults) => {
                    if (err) {
                        console.error('Error fetching inactive subscribers:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }

                    res.json({
                        active_subscribers: rangeResults[0]?.active_subscribers || 0,
                        inactive_subscribers: rangeResults[0]?.inactive_subscribers || 0,
                        new_active_subscribers: newActiveResults.length,
                        users: newActiveResults,
                        inactive_users: inactiveResults, // Add inactive user details here
                    });
                });
            });
        });
    });
});


// Backend route to get artist information, albums, and songs
router.get('/artist/:id', (req, res) => {
    const artistId = req.params.id;

    const query = `
        SELECT 
            ar.artist_id, ar.artistname, ar.artist_bio, ar.artist_event, ar.awards, ar.genre_type, ar.follower_count, ar.is_verified,
            al.album_id, al.album_name, al.release_date,
            s.song_id, s.title AS song_title, s.duration,
            COALESCE(ph_monthly.total_play_count, 0) AS total_play_count,
            COALESCE(l.total_likes, 0) AS total_likes
        FROM artist ar
        LEFT JOIN albums al ON ar.artist_id = al.artist_id
        LEFT JOIN song s ON al.album_id = s.album_id
        LEFT JOIN (
            SELECT ph.song_id, ph.total_play_count, ph.play_date
            FROM play_history ph
            INNER JOIN (
                SELECT song_id, MAX(play_date) AS last_play_date
                FROM play_history
                WHERE MONTH(play_date) = MONTH(CURRENT_DATE()) 
                  AND YEAR(play_date) = YEAR(CURRENT_DATE())
                GROUP BY song_id
            ) AS latest_play ON ph.song_id = latest_play.song_id AND ph.play_date = latest_play.last_play_date
        ) AS ph_monthly ON s.song_id = ph_monthly.song_id
        LEFT JOIN (
            SELECT song_id, COUNT(like_date) AS total_likes
            FROM likes
            GROUP BY song_id
        ) AS l ON s.song_id = l.song_id
        WHERE ar.artist_id = ?
        GROUP BY ar.artist_id, al.album_id, s.song_id;
    `;

    db.query(query, [artistId], (err, results) => {
        if (err) {
            console.error('Error fetching artist, albums, and songs:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        // Organize the results into a structured format
        const artistInfo = {
            artist_id: results[0].artist_id,
            artistname: results[0].artistname,
            artist_bio: results[0].artist_bio,
            artist_event: results[0].artist_event,
            awards: results[0].awards,
            genre_type: results[0].genre_type,
            follower_count: results[0].follower_count,
            is_verified: results[0].is_verified,
            albums: []
        };

        // Map albums and their songs
        const albumsMap = {};

        results.forEach(row => {
            // If album is not added yet, add it
            if (row.album_id && !albumsMap[row.album_id]) {
                albumsMap[row.album_id] = {
                    album_id: row.album_id,
                    album_name: row.album_name,
                    release_date: row.release_date,
                    songs: []
                };
                artistInfo.albums.push(albumsMap[row.album_id]);
            }
            // If there's a song, add it to the current album
            if (row.song_id) {
                albumsMap[row.album_id].songs.push({
                    song_id: row.song_id,
                    song_title: row.song_title,
                    duration: row.duration,
                    total_play_count: row.total_play_count,
                    total_likes: row.total_likes
                });
            }
        });

        res.json(artistInfo);
    });
});

export default router;

