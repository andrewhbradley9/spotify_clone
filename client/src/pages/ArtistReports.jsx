import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
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
// import { subDays } from 'date-fns';

const apiUrl = process.env.REACT_APP_API_URL;

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



const ArtistReports = () => {
    const [artistId, setArtistId] = useState('');
    const [compareArtistId, setCompareArtistId] = useState('');
    const [artistInfo, setArtistInfo] = useState(null);
    const [compareArtistInfo, setCompareArtistInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [platformActivity, setPlatformActivity] = useState([]);
    const [dateFilter] = useState('all');
    const [songs, setSongs] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], // Default to last 7 days
        endDate: new Date().toISOString().split('T')[0] // Today
    });
    const location = useLocation();
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const artistIdFromUrl = queryParams.get('artist_id');
        if (artistIdFromUrl) {
            setArtistId(artistIdFromUrl);
            fetchArtistInfo(artistIdFromUrl);
        }
    }, [location]);
    
    const fetchArtistInfo = async (id) => {
        setError(null);
        setArtistInfo(null);
        setLoading(true);
    
        try {
            const response = await axios.get(`${apiUrl}/artists/${id}`);
            console.log("Artist data received:", response.data);
            setArtistInfo(response.data);
        } catch (err) {
            console.error("Error details:", err);
            setError(err.response?.data?.error || 'An error occurred while fetching artist info');
        } finally {
            setLoading(false);
        }
    };
    
    const handleFetchArtistInfo = async (e) => {
        e.preventDefault();
        setError(null);
        setArtistInfo(null);
        setLoading(true);

        try {
            const response = await axios.get(`${apiUrl}/artists/${artistId}`);
            console.log("Artist data received:", response.data);
            setArtistInfo(response.data);
            
            await fetchSongs(artistId);
            
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
     // Ensure you import useCallback

    const fetchPlatformActivity = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}/artists/recent/activity`, {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    artistId: artistId
                }
            });
            setPlatformActivity(response.data);
        } catch (err) {
            console.error('Error fetching platform activity:', err);
        }
    }, [dateRange.startDate, dateRange.endDate, artistId]); // Dependencies for useCallback

    useEffect(() => {
        if (artistId) {
            fetchPlatformActivity();
        }
    }, [dateFilter, artistId, fetchPlatformActivity]); // Add fetchPlatformActivity as a dependency

    useEffect(() => {
        if (artistId) {
            fetchPlatformActivity();
        }
    }, [dateRange.startDate, dateRange.endDate, artistId, fetchPlatformActivity]);

    

    // // Add this function to filter song data
    // const filterSongsByDate = (songs) => {
    //     if (!songs || dateFilter === 'all') return songs;

    //     const now = new Date();
    //     const filterDate = {
    //         'day': subDays(now, 1),
    //         'week': subDays(now, 7),
    //         'month': subDays(now, 30)
    //     }[dateFilter];

    //     return songs.filter(song => new Date(song.last_played) >= filterDate);
    // };

    // Update the renderActivityTable function
    const renderActivityTable = () => {
        if (!platformActivity || platformActivity.length === 0) {
            return <p>No activity data available for the selected period.</p>;
        }

        return (
            <div className="table-container">
                <h3>Recent Activity</h3>
                <div className="date-range-selector">
                    <div className="input-group">
                        <label htmlFor="startDate">Start Date: </label>
                        <input
                            type="date"
                            id="startDate"
                            value={dateRange.startDate}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                            className="date-select"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="endDate">End Date: </label>
                        <input
                            type="date"
                            id="endDate"
                            value={dateRange.endDate}
                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                            className="date-select"
                        />
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {platformActivity.map((activity, index) => (
                            <tr key={`${activity.id}-${activity.type}-${index}`}>
                                <td className="date-cell">
                                    {new Date(activity.date).toLocaleDateString()}
                                </td>
                                <td>{activity.type}</td>
                                <td>{activity.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Add function to fetch songs
    const fetchSongs = async (id) => {
        try {
            const response = await axios.get(`${apiUrl}/artists/albums/songs/${id}`);
            console.log("Songs data received:", response.data);
            setSongs(response.data);
        } catch (err) {
            console.error("Error fetching songs:", err);
        }
    };

    // Update the songs performance table to use the songs state
    const renderSongsTable = () => (
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
                {songs.map(song => {
                    const performanceScore = (song.total_play_count || 0) + (song.total_likes || 0);
                    return (
                        <tr key={song.song_id}>
                            <td>{song.song_title}</td>
                            <td>{song.album_name}</td>
                            <td>{song.duration}</td>
                            <td>{song.total_play_count}</td>
                            <td>{song.total_likes}</td>
                            <td>{performanceScore}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    // Add this function to handle date changes
    const handleDateChange = (key, value) => {
        setDateRange(prev => ({
            ...prev,
            [key]: value
        }));
    };

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
                <>
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
                    <h3>Songs Performance</h3>
                    {renderSongsTable()}

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
                </>
            )}
        </div>
    );
};


export default ArtistReports;