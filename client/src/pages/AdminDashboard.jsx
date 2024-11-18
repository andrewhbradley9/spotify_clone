import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import '../AdminDashboard.css';

const apiUrl = process.env.REACT_APP_API_URL;

const AdminDashboard = () => {
    const [flaggedSongs, setFlaggedSongs] = useState([]);
    const [error, setError] = useState(null);

    const authToken = localStorage.getItem('token');

    useEffect(() => {
        const fetchFlaggedSongs = async () => {
            try {
                const { data } = await axios.get(`${apiUrl}/song/flagged`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setFlaggedSongs(data);
            } catch (err) {
                console.error('Error fetching flagged songs:', err);
                setError('Failed to fetch flagged songs.');
            }
        };

        fetchFlaggedSongs();
    }, [authToken]);

    const handleDeleteSong = async (songId) => {
        const isConfirmed = window.confirm('Are you sure you want to delete this song?');
        if (!isConfirmed) return;

        try {
            await axios.delete(`${apiUrl}/song/${songId}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setFlaggedSongs(flaggedSongs.filter((song) => song.song_id !== songId));
            alert('Song deleted successfully.');
        } catch (err) {
            console.error('Error deleting song:', err);
            alert('Failed to delete song.');
        }
    };

    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>Flagged Songs</h1>
            {flaggedSongs.length === 0 ? (
                <p>No flagged songs to review.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Genre</th>
                            <th>Play Count</th>
                            <th>Likes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flaggedSongs.map((song) => (
                            <tr key={song.song_id}>
                                <td>{song.title}</td>
                                <td>{song.genre_type}</td>
                                <td>{song.play_count}</td>
                                <td>{song.likes}</td>
                                <td>
                                    <button onClick={() => handleDeleteSong(song.song_id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
            )}

    {/* Add a Back to Main Page button */}
    <div className="dashboard-actions">
        <Link to="/artist">
            <button className="back-button">Back to Main Page</button>
        </Link>
    </div>
</div>
    );
};

export default AdminDashboard;
