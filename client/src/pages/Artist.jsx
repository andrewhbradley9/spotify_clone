import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
const apiUrl = process.env.REACT_APP_API_URL;
const Artist = () => {
    const [artists, setArtists] = useState([]);
    const [topSongs, setTopSongs] = useState([]); // State for top songs
    const [topArtists, setTopArtists] = useState([]); // State for top artists

    useEffect(() => {
        // Fetch both artists, top songs, and top artists
        const fetchArtistsTopSongsAndTopArtists = async () => {
            try {
                // Fetch artists
                const artistRes = await axios.get(`${apiUrl}/artists`);
                setArtists(artistRes.data);
                
                // Fetch top songs
                const songRes = await axios.get(`${apiUrl}/artists/songs/top10`);
                if (songRes.data && Array.isArray(songRes.data)) {
                    setTopSongs(songRes.data); // Set the top songs
                } else {
                    console.error("Unexpected response structure for top songs:", songRes.data);
                }

                // Fetch top artists
                const topArtistRes = await axios.get(`${apiUrl}/artists/artists/top10`);
                if (topArtistRes.data && Array.isArray(topArtistRes.data)) {
                    setTopArtists(topArtistRes.data); // Set the top artists
                } else {
                    console.error("Unexpected response structure for top artists:", topArtistRes.data);
                }
            } catch (err) {
                console.log("Error fetching data:", err);
            }
        };

        fetchArtistsTopSongsAndTopArtists();
    }, []); // Run on mount

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${apiUrl}/artists/${id}`);
            setArtists((prev) => prev.filter((artist) => artist.artist_id !== id));
        } catch (err) {
            console.error("Error deleting artist:", err.response?.data || err.message);
            alert("Failed to delete artist.");
        }
    };

    const resetPlayCount = async () => {
        try {
            const response = await axios.put(`${apiUrl}/artists/songs/reset-play-count`);
            alert(response.data.message); // Display success message
            window.location.reload(); // Refresh the page
        } catch (error) {
            console.error("Error resetting play counts:", error);
            alert("Error resetting play counts.");
        }
    };
    

    return (
        <div>
            <h1>coog_music</h1>
            <button className="search"><Link to={`/search/artist`}>Search Artist</Link></button>
            <button className="search"><Link to={`/search/song`}>Search Song</Link></button>
            <div><button className="fame"><Link to={`/Monthly/Reports`}>Users Wall of Fame</Link></button></div>
            <h2>Top 10 Songs</h2>
            <div className="top-songs">
                {topSongs.length > 0 ? (
                    topSongs.map(song => (
                        <p key={song.song_id}>
                            <Link to={`/play/${song.song_id}`}>
                                {song.title} - {song.artistname} (Plays: {song.play_count})
                            </Link>
                        </p>
                    ))
                ) : (
                    <p>No top songs available.</p>
                )}
            </div>

            <h2>Top 10 Artists</h2>
            <div className="top-artists">
                {topArtists.length > 0 ? (
                    topArtists.map(artist => (
                        <div className="artist" key={artist.artist_id}>
                            {artist.artist_image ? (
                                <img src={artist.artist_image} alt={artist.artistname} />
                            ) : (
                                <p>No image available</p>
                            )}
                            <h2>Artist: <span>{artist.artistname}</span></h2>
                            <p>Bio: <span>{artist.artist_bio || "No biography available"}</span></p>
                            <p>Events: <span>{artist.artist_event || "No Events Currently"}</span></p>
                            <p>Awards: <span>{artist.awards || "none"}</span></p>
                            <p>Genre: <span>{artist.genre_type || "Unknown genre"}</span></p>
                            <p>Followers: <span>{artist.follower_count > 0 ? artist.follower_count : "No followers"}</span></p>
                            <p>{artist.is_verified ? "Verified Artist" : "Not Verified"}</p>
                            <button className="album"><Link to={`/albums/${artist.artist_id}`}>Albums and Songs</Link></button>
                        </div>
                    ))
                ) : (
                    <p>No top artists available.</p>
                )}
            </div>

            <h2>Artists</h2>
            <div className="artists">
                {artists.map(artist => (
                    <div className="artist" key={artist.artist_id}>
                        {artist.artist_image ? (
                            <img src={artist.artist_image} alt={artist.artistname} />
                        ) : (
                            <p>No image available</p>
                        )}
                        <h2>Artist: <span>{artist.artistname}</span></h2>
                        <p>Bio: <span>{artist.artist_bio || "No biography available"}</span></p>
                        <p>Events: <span>{artist.artist_event || "No Events Currently"}</span></p>
                        <p>Awards: <span>{artist.awards || "none"}</span></p>
                        <p>Genre: <span>{artist.genre_type || "Unknown genre"}</span></p>
                        <p>Followers: <span>{artist.follower_count > 0 ? artist.follower_count : "No followers"}</span></p>
                        <p>{artist.is_verified ? "Verified Artist" : "Not Verified"}</p>
                        <button className="delete" onClick={() => handleDelete(artist.artist_id)}>Delete</button>
                        <button className="update"><Link to={`/update/${artist.artist_id}`}>Update</Link></button>
                        <button className="upload"><Link to={`/uploadSong/${artist.artist_id}`}>Upload a Song</Link></button>
                        <button className="album"><Link to={`/albums/${artist.artist_id}`}>Albums and Songs</Link></button>
                    </div>
                ))}
            </div>

            <p>
                <button className="add">
                    <Link to="/add">Add new Artist</Link>
                </button>
            </p>

            {/* Button to reset play counts */}
            <button className="reset-play-count" onClick={resetPlayCount}>
                Reset Play Counts for the Month
            </button>
        </div>
    );
};

export default Artist;
