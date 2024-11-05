import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;
const Albums = () => {
    const { id: artistId } = useParams(); // Get artistId from URL parameters
    const navigate = useNavigate(); // Initialize useNavigate
    const [albums, setAlbums] = useState([]);
    const [artistName, setArtistName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const artistResponse = await axios.get(`${apiUrl}/artists/${artistId}`);
                setArtistName(artistResponse.data.artistname);

                const response = await axios.get(`${apiUrl}/artists/albums/${artistId}`);
                const albumsData = response.data;

                // Fetch songs for each album and calculate total duration
                const albumsWithSongs = await Promise.all(
                    albumsData.map(async (album) => {
                        const songsResponse = await axios.get(`${apiUrl}/artists/albums/${album.album_id}/songs/${artistId}`);
                        const songs = songsResponse.data;

                        // Calculate total duration in seconds
                        const totalDuration = songs.reduce((total, song) => {
                            return total + convertDurationToSeconds(song.duration); // Convert duration to seconds
                        }, 0);

                        return { ...album, totalDuration, songs };
                    })
                );

                setAlbums(albumsWithSongs);
            } catch (err) {
                setError('Error fetching albums');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlbums();
    }, [artistId]);

    // Function to format the release date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options).replace(',', ''); // Format and remove comma
    };

    // Function to convert hh:mm:ss to total seconds
    const convertDurationToSeconds = (duration) => {
        if (!duration) return 0; // Handle cases with no duration
        const [hours, minutes, seconds] = duration.split(':').map(Number); // Split and convert to numbers
        return (hours * 3600) + (minutes * 60) + seconds; // Convert to total seconds
    };

    // Function to format total duration
    const formatDuration = (totalSeconds) => {
        if (totalSeconds === 0) return '0s'; // Handle case for zero duration
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        let formattedDuration = '';
        if (hours > 0) {
            formattedDuration += `${hours}h `;
        }
        if (minutes > 0 || hours > 0) {
            formattedDuration += `${minutes}m `;
        }
        formattedDuration += `${seconds}s`;
        
        return formattedDuration.trim();
    };

    if (loading) {
        return <div>Loading albums...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }
    const handleGoHome = () => {
        navigate('/'); // Navigate to the main page
    };
    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
            <h2>Albums by {artistName}</h2>
            {albums.length > 0 ? (
                <ul>
                    {albums.map(album => (
                        <li key={album.album_id}>
                            <Link to={`/albums/${album.album_id}/songs/${artistId}`}>
                                <h3>{album.album_name}</h3>
                            </Link>
                            <p>Release Date: {formatDate(album.release_date)}</p>
                            <p>Total Duration: {formatDuration(album.totalDuration)}</p> {/* Display total duration */}
                            <p>Total Likes: {album.songs.reduce((total, song) => total + (song.likes || 0), 0)}</p> {/* Calculate and display total likes */}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No albums found for this artist.</p>
            )}
        </div>
    );
};

export default Albums;
