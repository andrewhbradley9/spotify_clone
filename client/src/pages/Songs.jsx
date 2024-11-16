import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
const apiUrl = process.env.REACT_APP_API_URL;
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"></link>
const AlbumSongs = () => {
    const { albumId, artistId } = useParams(); 
    const navigate = useNavigate(); 
    const [songs, setSongs] = useState([]);
    const [albumDetails, setAlbumDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { playSong } = useAudio();

    useEffect(() => {
        const fetchAlbumAndSongs = async () => {
            try {
                const albumResponse = await axios.get(`${apiUrl}/artists/targetalbum/${albumId}`);
                setAlbumDetails(albumResponse.data);
                const songsResponse = await axios.get(`${apiUrl}/artists/albums/${albumId}/songs/${artistId}`);
                setSongs(songsResponse.data);
            } catch (err) {
                setError('Error fetching album or songs');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAlbumAndSongs();
    }, [albumId, artistId]);

    const handleGoHome = () => {
        navigate('/artist'); 
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'null'; 
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options).replace(',', '');
    };

    const formatDuration = (totalSeconds) => {
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
        return <div>Loading songs...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="songs-page">
            <div className="songs-header">
                {albumDetails && (
                    <div className="album-header">
                        {albumDetails.album_image ? (
                            <img src={albumDetails.album_image} alt={albumDetails.album_name} className="album-cover" />
                        ) : (
                            <div className="album-placeholder">
                                <span>{albumDetails.album_name[0]}</span>
                            </div>
                        )}
                        <div className="album-info">
                            <span className="album-label">Album</span>
                            <h1>{albumDetails.album_name}</h1>
                            <div className="album-meta">
                                <span>{formatDate(albumDetails.release_date)}</span>
                                <span>•</span>
                                <span>{songs.length} songs</span>
                                <span>•</span>
                                <span>{albumDetails.total_duration ? formatDuration(albumDetails.total_duration) : '0s'}</span>
                            </div>
                        </div>
                    
                    </div>
                )}
            </div>

            <div className="songs-list">
                <div className="songs-table">
                    <div className="song-header">
                        <span>#</span>
                        <span>Title</span>
                        <span>Duration</span>
                        <span></span>
                    </div>
                    {songs.map((song, index) => (
                        <div key={song.song_id} className="song-row">
                            <span className="song-number">{index + 1}</span>
                            <div className="song-title-info">
                                {song.song_image && <img src={song.song_image} alt={song.title} />}
                                <div>
                                    <h4>{song.title}</h4>
                                    <p>{song.genre_type}</p>
                                </div>
                            </div>
                            <span className="song-duration">{song.duration}</span>
                            <button 
                                onClick={() => playSong({...song, album_id: albumId})} 
                                className="play-button"
                            >
                                Play
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="navigation-buttons">
                <Link to={`/albums/${artistId}`} className="nav-button">
                    <span className="material-icons"></span>
                    Back to Albums
                </Link>
                <button onClick={handleGoHome} className="nav-button">
                    <span className="material-icons"></span>
                    Back to Artists
                </button>
                <div className="album-actions">
                    {/* Conditional rendering for Update Album button */}
                    {(localStorage.getItem('role') === 'admin' || localStorage.getItem('artistId') === String(artistId)) && (
                        <button 
                            className="update-album"
                            onClick={() => navigate(`/uploadAlbum/${artistId}/${albumId}`)}
                        >
                            Update Album
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AlbumSongs;
