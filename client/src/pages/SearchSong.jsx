import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;
const SongSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!searchTerm) {
            alert('Please enter a search term');
            return;
        }

        try {
            const response = await fetch("http://localhost:3360/artists/search/songname?term=${encodeURIComponent(searchTerm)}");
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setResults(data);
            setError(data.length === 0 ? 'No songs found.' : '');
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('An error occurred while searching for songs.');
            setResults([]);
        }
    };

    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/'); // Navigate to the main page
    };

    // Function to handle key press in the input field
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div>
            <h1>Search for Songs</h1>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter song title"
                onKeyPress={handleKeyPress} // Add this line
            />
            <h2>
                <p><button onClick={handleSearch}>Search</button></p>
                <p><button className="cancel" onClick={handleGoHome}>Cancel</button></p>
            </h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <div className="results">
                {results.length === 0 && <p>No songs found.</p>}
                {results.map((song) => (
                    <div key={song.song_id} className="song">
                        <h3>{song.title}</h3>
                        {song.songimage && <img src={song.songimage} alt={song.title} />}
                        <p>Duration: {song.duration || 'N/A'}</p>
                        <p>Release Date: {song.song_releasedate || 'N/A'}</p>
                        <p>Genre: {song.genre_type || 'N/A'}</p>
                        <p>Language: {song.song_language || 'N/A'}</p>
                        {song.mp3 && (
                            <Link to={`/play/${song.song_id}`} className="play-button">
                                Play Song
                            </Link>
                        )}
                        {!song.mp3 && <p>No MP3 available for this song.</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SongSearch;
