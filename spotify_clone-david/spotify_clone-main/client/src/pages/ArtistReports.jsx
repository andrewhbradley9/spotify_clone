import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    BarElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { format, subDays } from 'date-fns';

ChartJS.register(
    LineElement, 
    BarElement,
    PointElement, 
    CategoryScale, 
    LinearScale, 
    Title, 
    Tooltip, 
    Legend
);

const apiUrl = process.env.REACT_APP_API_URL;

const ArtistReports = () => {
    const [artistId, setArtistId] = useState('');
    const [compareArtistId, setCompareArtistId] = useState('');
    const [artistInfo, setArtistInfo] = useState(null);
    const [compareArtistInfo, setCompareArtistInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [platformActivity, setPlatformActivity] = useState([]);
    const [dateFilter, setDateFilter] = useState('all');

    const handleFetchArtistInfo = async (e) => {
        e.preventDefault();
        setError(null);
        setArtistInfo(null);
        setLoading(true);

        try {
            const response = await axios.get(`${apiUrl}/artists/${artistId}`);
            console.log("Artist data received:", response.data);
            setArtistInfo(response.data);
            
            if (compareArtistId) {
                const compareResponse = await axios.get(`${apiUrl}/artists/${compareArtistId}`);
                console.log("Compare artist data:", compareResponse.data);
                setCompareArtistInfo(compareResponse.data);
            }
        } catch (err) {
            console.error("Error details:", err);
            setError(err.response?.data?.error || 'An error occurred while fetching artist info');
        } finally {
            setLoading(false);
        }
    };

    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/artist');
    };

    // Calculate total metrics for an artist
    const calculateTotals = (artist) => {
        if (!artist?.albums) return { totalLikes: 0, totalPlayCount: 0 };
        
        let totalLikes = 0;
        let totalPlayCount = 0;

        artist.albums.forEach(album => {
            album.songs.forEach(song => {
                totalLikes += song.total_likes || 0;
                totalPlayCount += song.total_play_count || 0;
            });
        });

        return { totalLikes, totalPlayCount };
    };

    // Prepare comparison chart data
    const comparisonChartData = {
        labels: ['Followers', 'Total Likes', 'Total Play Count'],
        datasets: [
            {
                label: artistInfo?.artistname || 'Current Artist',
                data: artistInfo ? [
                    artistInfo.follower_count,
                    calculateTotals(artistInfo).totalLikes,
                    calculateTotals(artistInfo).totalPlayCount
                ] : [],
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
            compareArtistInfo && {
                label: compareArtistInfo?.artistname || 'Comparison Artist',
                data: [
                    compareArtistInfo.follower_count,
                    calculateTotals(compareArtistInfo).totalLikes,
                    calculateTotals(compareArtistInfo).totalPlayCount
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            }
        ].filter(Boolean),
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Artist Metrics Comparison',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    // Function to fetch platform activity
    const fetchPlatformActivity = async () => {
        try {
            const response = await axios.get(`http://localhost:3360/artists/activity/recent?filter=${dateFilter}`);
            setPlatformActivity(response.data);
        } catch (err) {
            console.error('Error fetching platform activity:', err);
        }
    };

    // Call fetchPlatformActivity when component mounts
    useEffect(() => {
        fetchPlatformActivity();
    }, [dateFilter]);

    // Add this function to filter song data
    const filterSongsByDate = (songs) => {
        if (!songs || dateFilter === 'all') return songs;

        const now = new Date();
        const filterDate = {
            'day': subDays(now, 1),
            'week': subDays(now, 7),
            'month': subDays(now, 30)
        }[dateFilter];

        return songs.filter(song => new Date(song.last_played) >= filterDate);
    };

    // Modify the renderActivityTable function
    const renderActivityTable = () => (
        <div className="events-section">
            <h3>Recent Platform Activity</h3>
            <div className="date-filter">
                <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="date-select"
                >
                    <option value="all">All Time</option>
                    <option value="month">Last 30 Days</option>
                    <option value="week">Last 7 Days</option>
                    <option value="day">Last 24 Hours</option>
                </select>
            </div>
            <table className="artist-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Artist</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {platformActivity.map(activity => (
                        <tr key={activity.id}>
                            <td>{format(new Date(activity.date), 'MMM dd, yyyy')}</td>
                            <td>{activity.type}</td>
                            <td>{activity.artistname}</td>
                            <td>{activity.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
            <h1>Artist Reports</h1>
            
            <form onSubmit={handleFetchArtistInfo} className="comparison-form">
                <div className="input-group">
                    <label>
                        Artist ID:
                        <input
                            type="text"
                            value={artistId}
                            onChange={(e) => setArtistId(e.target.value)}
                            placeholder="Enter Artist ID"
                            required
                        />
                    </label>
                </div>
                
                <div className="comparison-toggle">
                    <label>
                        <input
                            type="checkbox"
                            checked={showComparison}
                            onChange={(e) => {
                                setShowComparison(e.target.checked);
                                if (!e.target.checked) {
                                    setCompareArtistId('');
                                    setCompareArtistInfo(null);
                                }
                            }}
                        />
                        Compare with another artist
                    </label>
                </div>

                {showComparison && (
                    <div className="input-group">
                        <label>
                            Compare with Artist ID:
                            <input
                                type="text"
                                value={compareArtistId}
                                onChange={(e) => setCompareArtistId(e.target.value)}
                                placeholder="Enter Comparison Artist ID"
                            />
                        </label>
                    </div>
                )}
                
                <button type="submit">Generate Report</button>
            </form>

            {loading ? (
                <div className="loading">
                    <p>Searching<span className="dots">...</span></p>
                </div>
            ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
            ) : artistInfo && (
                <div>
                    {/* Artist Information Table */}
                    <table className="artist-table">
                        <thead>
                            <tr>
                                <th colSpan="2">Artist Information</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th>Artist Name</th>
                                <td>{artistInfo.artistname}</td>
                            </tr>
                            <tr>
                                <th>Bio</th>
                                <td>{artistInfo.artist_bio}</td>
                            </tr>
                            <tr>
                                <th>Event</th>
                                <td>{artistInfo.artist_event}</td>
                            </tr>
                            <tr>
                                <th>Awards</th>
                                <td>{artistInfo.awards}</td>
                            </tr>
                            <tr>
                                <th>Genre</th>
                                <td>{artistInfo.genre_type}</td>
                            </tr>
                            <tr>
                                <th>Followers</th>
                                <td>{artistInfo.follower_count}</td>
                            </tr>
                            <tr>
                                <th>Verified</th>
                                <td>{artistInfo.is_verified ? 'Yes' : 'No'}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Move the activity table here, right after artist info */}
                    {renderActivityTable()}

                    {/* Songs Performance Table */}
                    <table className="artist-table">
                        <thead>
                            <tr>
                                <th>Song Title</th>
                                <th>Album</th>
                                <th>Duration</th>
                                <th>Play Count</th>
                                <th>Likes</th>
                                <th>Performance Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {artistInfo.albums?.map(album => 
                                filterSongsByDate(album.songs)?.map(song => {
                                    const performanceScore = (song.total_play_count || 0) + (song.total_likes || 0);
                                    return (
                                        <tr key={song.song_id}>
                                            <td>{song.song_title}</td>
                                            <td>{album.album_name}</td>
                                            <td>{song.duration}</td>
                                            <td>{song.total_play_count}</td>
                                            <td>{song.total_likes}</td>
                                            <td>{performanceScore}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* Only show comparison chart if comparison is enabled and we have comparison data */}
                    {showComparison && compareArtistInfo ? (
                        <div className="chart-container">
                            <h3>Artist Comparison Overview</h3>
                            <Bar data={comparisonChartData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="chart-container">
                            <h3>Artist Performance Overview</h3>
                            <Bar 
                                data={{
                                    labels: ['Followers', 'Total Likes', 'Total Play Count'],
                                    datasets: [{
                                        label: artistInfo.artistname,
                                        data: [
                                            artistInfo.follower_count,
                                            calculateTotals(artistInfo).totalLikes,
                                            calculateTotals(artistInfo).totalPlayCount
                                        ],
                                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                        borderColor: 'rgba(255, 99, 132, 1)',
                                        borderWidth: 1,
                                    }]
                                }}
                                options={chartOptions}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export default ArtistReports;
