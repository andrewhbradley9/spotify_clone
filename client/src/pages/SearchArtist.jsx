import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link from react-router-dom
const apiUrl = process.env.REACT_APP_API_URL;
const ArtistSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!searchTerm) {
            alert('Please enter a search term');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/artists/search/artistname?term=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setResults(data);
            setError(data.length === 0 ? 'No artists found.' : '');
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('An error occurred while searching for artists.');
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
            <h1>Search for Artists</h1>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter artist name"
                onKeyPress={handleKeyPress} // Add this line
            />
            <h2>
                <p><button onClick={handleSearch}>Search</button></p>
                <p><button className="cancel" onClick={handleGoHome}>Cancel</button></p>
            </h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <div className="results">
                {results.map((artist) => (
                    <div key={artist.artist_id} className="artist">
                        <h3>{artist.artistname}</h3>
                        <p>Bio: {artist.artist_bio || 'N/A'}</p>
                        <p>Genre: {artist.genre_type || 'N/A'}</p>
                        <p>Awards: {artist.awards || 'N/A'}</p>
                        
                        {/* Button wrapped in a Link to navigate to albums page */}
                        <Link to={`/albums/${artist.artist_id}`}>
                            <button className="album">Albums and Songs</button>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArtistSearch;
