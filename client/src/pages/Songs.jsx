import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate} from 'react-router-dom';
import { useAudio } from '../context/AudioContext';

const apiUrl = process.env.REACT_APP_API_URL;

const AlbumSongs = () => {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [albumData, setAlbumData] = useState(null); // Consolidated state for album and songs
    const [likedSongs, setLikedSongs] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { playSong } = useAudio();

    const authToken = localStorage.getItem('token'); // Retrieve auth token for authenticated requests

    useEffect(() => {
        const fetchAlbumDetails = async () => {
            try {
                const { data } = await axios.get(`${apiUrl}/artists/albums/${albumId}/details`, {
                    headers: { Authorization: `Bearer ${authToken}` }, // Include token for authenticated requests
                });

                // Update state with album details and songs
                setAlbumData({
                    album_id: data.album_id,
                    album_name: data.album_name,
                    release_date: data.release_date,
                    artist_id: data.artist_id,
                    artist_name: data.artist_name,
                    songs: data.songs,
                });
                
                // Optionally set liked songs from the fetched data
                setLikedSongs(new Set(data.songs.filter((song) => song.is_liked).map((song) => song.song_id)));
            } catch (err) {
                setError('Error fetching album details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlbumDetails();
    }, [albumId, authToken]);

    const handleLikeToggle = async (songId) => {
        try {
            if (likedSongs.has(songId)) {
                // Unlike the song
                await axios.delete(`${apiUrl}/song/like/${songId}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setLikedSongs((prev) => {
                    const updated = new Set(prev);
                    updated.delete(songId);
                    return updated;
                });
            } else {
                // Like the song
                await axios.post(
                    `${apiUrl}/song/like/${songId}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );
                setLikedSongs((prev) => new Set(prev).add(songId));
            }
        } catch (err) {
            console.error('Error toggling like status:', err);
            alert('Failed to update like status.');
        }
    };

    const handleReportSong = async (songId) => {
        try {
            await axios.post(
                `${apiUrl}/song/report/${songId}`,
                {}, // No body needed
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );
            alert('Song reported successfully.');
        } catch (err) {
            console.error('Error reporting song:', err);
            alert('Failed to report the song.');
        }
    };

    const handleGoHome = () => {
        navigate('/artist');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'null';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options).replace(',', '');
    };

    const formatDuration = (duration) => {
        if (!duration) return '0:00';
        const [hours, minutes, seconds] = duration.split(':');
        const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) {
        return <div>Loading album details...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!albumData) {
        return <div>No album data available.</div>;
    }

    return (
        <div className="songs-page">
            <div className="songs-header">
                <div className="album-header">
                    {albumData.album_image ? (
                        <img src={albumData.album_image} alt={albumData.album_name} className="album-cover" />
                    ) : (
                        <div className="album-placeholder">
                            <span>{albumData.album_name[0]}</span>
                        </div>
                    )}
                    <div className="album-info">
                        <span className="album-label">Album</span>
                        <h1>{albumData.album_name}</h1>
                        <div className="album-meta">
                            <span>{formatDate(albumData.release_date)}</span>
                            <span>•</span>
                            <span>{albumData.songs.length} songs</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="songs-list">
                <div className="songs-table">
                    <div className="song-header">
                        <span>#</span>
                        <span>Title</span>
                        <span>Plays</span>
                        <span>Duration</span>
                        <span>Actions</span>
                    </div>
                    {albumData.songs.map((song, index) => (
                        <div key={song.song_id} className="song-row">
                            <span className="song-number">{index + 1}</span>
                            <div className="song-title-info">
                                <div>
                                    <h4>{song.title}</h4>
                                    <p>{song.genre_type}</p>
                                </div>
                            </div>
                            <span className="song-plays">{song.play_count}</span>
                            <span className="song-duration">{formatDuration(song.duration)}</span>
                            <div className="song-actions">
                                <button
                                    onClick={() => playSong({ ...song, album_id: albumData.album_id })}
                                    className="play-button"
                                >
                                    Play
                                </button>
                                <button
                                    onClick={() => handleReportSong(song.song_id)}
                                    className="report-button"
                                >
                                    Report
                                </button>
                                <button
                                    onClick={() => handleLikeToggle(song.song_id)}
                                    className={`like-button ${song.is_liked ? 'liked' : ''}`}
                                >
                                    {song.is_liked ? '❤️' : '🤍'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="navigation-buttons">
                {/* <Link to={`/artist/${albumData.artist_id}`} className="nav-button">
                    Back to Artist
                </Link> */}
                <button onClick={handleGoHome} className="nav-button">
                    Back to Artists
                </button>
            </div>
        </div>
    );
};

export default AlbumSongs;
