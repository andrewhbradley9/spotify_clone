import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAudio } from '../context/AudioContext';
const apiUrl = process.env.REACT_APP_API_URL;
const Artist = () => {
    const { playSong } = useAudio();
    const [artists, setArtists] = useState([]);
    const [topSongs, setTopSongs] = useState([]); // State for top songs
    const [topArtists, setTopArtists] = useState([]); // State for top artists
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState({ artists: [], songs: [] });
    const [isSearching, setIsSearching] = useState(false);

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

    // const handleDelete = async (id) => {
    //     try {
    //         await axios.delete(`${apiUrl}/artists/${id}`);
    //         setArtists((prev) => prev.filter((artist) => artist.artist_id !== id));
    //     } catch (err) {
    //         console.error("Error deleting artist:", err.response?.data || err.message);
    //         alert("Failed to delete artist.");
    //     }
    // };

    /* const resetPlayCount = async () => {
        try {
            const response = await axios.put(`${apiUrl}/artists/songs/reset-play-count`);
            alert(response.data.message); // Display success message
            window.location.reload(); // Refresh the page
        } catch (error) {
            console.error("Error resetting play counts:", error);
            alert("Error resetting play counts.");
        }
    };
*/
    const handleSearch = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (term.length > 0) {
            setIsSearching(true);
            try {
                const [artistRes, songRes] = await Promise.all([
                    axios.get(`${apiUrl}/artists/search/artistname?term=${encodeURIComponent(term)}`),
                    axios.get(`${apiUrl}/artists/search/songname?term=${encodeURIComponent(term)}`)
                ]);
                
                setSearchResults({
                    artists: artistRes.data || [],
                    songs: songRes.data || []
                });
            } catch (err) {
                console.error("Search error:", err);
                setSearchResults({ artists: [], songs: [] });
            }
        } else {
            setIsSearching(false);
            setSearchResults({ artists: [], songs: [] });
        }
    };

    return (
        <div className="main-content">
            <h1>Banger</h1>
            
            <div className="search-bar-container">
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Search for artists or songs..."
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            {isSearching ? (
                <div className="search-results">
                    {searchResults.artists.length > 0 && (
                        <div className="search-section">
                            <h2>Artists</h2>
                            <div className="artists">
                                {searchResults.artists.map(artist => (
                                    <Link to={`/artist/${artist.artist_id}`} key={artist.artist_id} className="artist-link">
                                        <div className="artist">
                                            {artist.artist_image ? (
                                                <img src={artist.artist_image} alt={artist.artistname} />
                                            ) : (
                                                <p>No image available</p>
                                            )}
                                            <h2>{artist.artistname}</h2>
                                            <p>{artist.genre_type || "Unknown genre"}</p>
                                            {artist.is_verified && <p className="verified">✓ Verified Artist</p>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResults.songs.length > 0 && (
                        <div className="search-section">
                            <h2>Songs</h2>
                            <div className="songs-grid">
                                {searchResults.songs.map(song => (
                                    <div key={song.song_id} className="song-card">
                                        {song.songimage && <img src={song.songimage} alt={song.title} />}
                                        <h3>{song.title}</h3>
                                        <p>{song.artistname}</p>
                                        <button 
                                            onClick={() => playSong(song)}
                                            className="play-button"
                                        >
                                            Play Song
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResults.artists.length === 0 && searchResults.songs.length === 0 && (
                        <p className="no-results">No results found</p>
                    )}
                </div>
            ) : (
                <>
                    <h2>Top 10 Songs</h2>
                    <div className="top-songs">
                        {topSongs.length > 0 ? (
                            topSongs.map(song => (
                                <div key={song.song_id} className="top-song-item">
                                    <button 
                                        onClick={() => playSong(song)}
                                        className="song-play-button"
                                    >
                                        {song.title} - {song.artistname} (Plays: {song.play_count})
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No top songs available.</p>
                        )}
                    </div>

                    <h2>Top 10 Artists</h2>
                    <div className="top-artists">
                        {topArtists.length > 0 ? (
                            topArtists.map(artist => (
                                <Link to={`/artist/${artist.artist_id}`} key={artist.artist_id} className="artist-link">
                                    <div className="artist">
                                        {artist.artist_image ? (
                                            <img src={artist.artist_image} alt={artist.artistname} />
                                        ) : (
                                            <p>No image available</p>
                                        )}
                                        <h2>{artist.artistname}</h2>
                                        <p>{artist.genre_type || "Unknown genre"}</p>
                                        {artist.is_verified && <p className="verified">✓ Verified Artist</p>}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p>No top artists available.</p>
                        )}
                    </div>

                    <h2>Artists</h2>
                    <div className="artists">
                        {artists.map(artist => (
                            <Link to={`/artist/${artist.artist_id}`} key={artist.artist_id} className="artist-link">
                                <div className="artist">
                                    {artist.artist_image ? (
                                        <img src={artist.artist_image} alt={artist.artistname} />
                                    ) : (
                                        <p>No image available</p>
                                    )}
                                    <h2>{artist.artistname}</h2>
                                    <p>{artist.genre_type || "Unknown genre"}</p>
                                    {artist.is_verified && <p className="verified">✓ Verified Artist</p>}
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="button-container">
                        <button className="add">
                            <Link to="/add">Add new Artist</Link>
                        </button>
                        
                       {/* <button className="reset-play-count" onClick={resetPlayCount}>
                            Reset Play Counts for the Month
                                    </button>  */}
                    </div>
                </>
            )}
        </div>
    );
};

export default Artist;