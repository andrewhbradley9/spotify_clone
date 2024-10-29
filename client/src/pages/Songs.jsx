import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;
const AlbumSongs = () => {
    const { albumId, artistId } = useParams(); 
    const navigate = useNavigate(); 
    const [songs, setSongs] = useState([]);
    const [albumDetails, setAlbumDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        navigate('/'); 
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
        <div>
            <button className="cancel"><Link to={`/albums/${artistId}`}>Back to Albums</Link></button>
            <div><p><button className="cancel" onClick={handleGoHome}>Back to Artists</button></p></div>
            {albumDetails ? (
                <div>
                    <h2>{albumDetails.album_name}</h2>
                    <p>Release Date: {formatDate(albumDetails.release_date)}</p>
                    <p>Total Duration: {albumDetails.total_duration ? formatDuration(albumDetails.total_duration) : '0s'}</p>
                </div>
            ) : (
                <p>Album details not found.</p>
            )}
            <h3>Songs in Album</h3>
            {songs.length > 0 ? (
                <ul>
                    {songs.map(song => (
                        <li key={song.song_id}>
                            <h4>Title: {song.title || 'null'}</h4>
                            {song.song_image ? (
                                <img src={song.song_image} alt={song.title || 'null'} style={{ width: '100px', height: '100px' }} />
                            ) : (
                                <p>Image: null</p>
                            )}
                            <p>Duration: {song.duration || 'null'}</p>
                            <p>Release Date: {formatDate(song.song_releasedate) || 'null'}</p>
                            <p>Genre: {song.genre_type || 'null'}</p>
                            <p>Language: {song.song_language || 'null'}</p>
                            <p>File Path: {song.file_path || 'null'}</p>
                            <Link to={`/play/${albumId}/${song.song_id}`} className="play-button">
                                Play Song
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No songs found for this album.</p>
            )}
        </div>
    );
};

export default AlbumSongs;
