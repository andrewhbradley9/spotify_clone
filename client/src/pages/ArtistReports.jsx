import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const ArtistReports = () => {
    const [artistId, setArtistId] = useState('');
    const [artistInfo, setArtistInfo] = useState(null);
    const [loading, setLoading] = useState(false); // State for loading
    const [error, setError] = useState(null);

    const handleFetchArtistInfo = async (e) => {
        e.preventDefault();
        setError(null);
        setArtistInfo(null);
        setLoading(true); // Start loading

        try {
            const response = await axios.get(`http://localhost:3360/artists/artist/${artistId}`);
            setArtistInfo(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while fetching artist info');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/artist');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-CA');
    };

    // Calculate total likes and play counts across all songs
    const calculateTotals = (albums) => {
        let totalLikes = 0;
        let totalPlayCount = 0;

        albums.forEach(album => {
            album.songs.forEach(song => {
                totalLikes += song.total_likes || 0;
                totalPlayCount += song.total_play_count || 0;
            });
        });

        return { totalLikes, totalPlayCount };
    };

    const { totalLikes, totalPlayCount } = artistInfo ? calculateTotals(artistInfo.albums) : { totalLikes: 0, totalPlayCount: 0 };

    // Data for the line chart
    const chartData = {
        labels: ['Followers', 'Total Likes', 'Total Play Count'],
        datasets: [
            {
                label: 'Followers',
                data: [artistInfo?.follower_count || 0, null, null],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.1,
            },
            {
                label: 'Total Likes',
                data: [null, totalLikes, null],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.1,
            },
            {
                label: 'Total Play Count',
                data: [null, null, totalPlayCount],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Artist Metrics Overview',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Count',
                },
            },
        },
    };

    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
            <h1>Artist Reports</h1>
            <form onSubmit={handleFetchArtistInfo}>
                <label>
                    Enter Artist ID:
                    <input
                        type="text"
                        value={artistId}
                        onChange={(e) => setArtistId(e.target.value)}
                        placeholder="Artist ID"
                        required
                    />
                </label>
                <button type="submit">Fetch Artist Info</button>
            </form>

            {loading ? (
                <div className="loading">
                    <p>Searching<span className="dots">...</span></p>
                </div>
            ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
            ) : artistInfo && (
                <div>
                    <h2>Artist Information</h2>
                    <p><strong>Artist Name:</strong> {artistInfo.artistname}</p>
                    <p><strong>Bio:</strong> {artistInfo.artist_bio}</p>
                    <p><strong>Event:</strong> {artistInfo.artist_event}</p>
                    <p><strong>Awards:</strong> {artistInfo.awards}</p>
                    <p><strong>Genre:</strong> {artistInfo.genre_type}</p>
                    <p><strong>Follower Count:</strong> {artistInfo.follower_count}</p>
                    <p><strong>Verified:</strong> {artistInfo.is_verified ? 'Yes' : 'No'}</p>
                    <p><strong>Rank:</strong> {artistInfo.rank}</p>

                    <h3>Albums</h3>
                    {artistInfo.albums && artistInfo.albums.length > 0 ? (
                        artistInfo.albums.map(album => (
                            <div key={album.album_id} style={{ marginBottom: '20px', marginLeft: '20px' }}>
                                <p><strong>Album Name:</strong> {album.album_name}</p>
                                <p><strong>Release Date:</strong> {formatDate(album.release_date)}</p>

                                <h4>Songs</h4>
                                {album.songs && album.songs.length > 0 ? (
                                    <ul>
                                        {album.songs.map(song => (
                                            <li key={song.song_id}>
                                                <p><strong>Title:</strong> {song.song_title}</p>
                                                <p><strong>Duration:</strong> {song.duration}</p>
                                                <p><strong>Total Play Count:</strong> {song.total_play_count}</p>
                                                <p><strong>Total Likes:</strong> {song.total_likes}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No songs available for this album.</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No albums available for this artist.</p>
                    )}

                    {/* Line Chart for Artist Metrics */}
                    <div style={{ marginTop: '40px' }}>
                        <h3>Artist Metrics Overview</h3>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtistReports;