import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
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
    const [searchQuery, setSearchQuery] = useState(''); // For storing the search input
    const [searchResults, setSearchResults] = useState([]); // For storing the list of search results
    const [compareArtistName, setCompareArtistName] = useState('');
    const userRole = localStorage.getItem('role');
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
            setArtistId((prevArtistId) => (prevArtistId ? prevArtistId : artistIdFromUrl));
        }
    }, [location]);
    const handleArtistIdChange = (e) => {
        setArtistId(e.target.value);
    };
    const searchArtists = async () => {
        if (!searchQuery.trim()) return;
        try {
            const response = await axios.get(`${apiUrl}/search/artistname`, {
                params: { term: searchQuery },
            });
            setSearchResults(response.data);
        } catch (err) {
            console.error('Error searching for artists:', err);
        }
    };
    const handleSearchSelect = async (id, name) => {
        setCompareArtistId(id); // Set the artist ID
        setCompareArtistName(name); // Set the artist name
        setSearchQuery(''); // Clear the search input
        setSearchResults([]); // Clear the search results
        handleFetchArtistInfo(id);
        try {
            // Fetch the comparison artist's info immediately after setting the ID
            const compareResponse = await axios.get(`${apiUrl}/artists/${id}`);
            console.log("Compare artist data:", compareResponse.data);
            setCompareArtistInfo(compareResponse.data);
        } catch (err) {
            console.error('Error fetching compare artist info:', err);
        }
    };
    
    useEffect(() => {
        if (userRole === 'artist'){
            const storedArtistId = localStorage.getItem('artistId');
        if (storedArtistId) {
            setArtistId(storedArtistId);
            fetchArtistInfo(storedArtistId);
            fetchSongs(storedArtistId);
        }
        }
    }, []);
    
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
    const calculateTotals = () => {
        if (!Array.isArray(songs) || songs.length === 0) {
            return { totalLikes: 0, totalPlayCount: 0 };
        }
    
        let totalLikes = 0;
        let totalPlayCount = 0;
    
        songs.forEach((song, index) => {
            totalLikes += Number(song.total_likes) || 0; // Ensure it's a number
            totalPlayCount += Number(song.total_play_count) || 0; // Ensure it's a number
        });
        return { totalLikes, totalPlayCount };
    };
    
    const totals = calculateTotals();
    const comparisonTotals = compareArtistInfo ? calculateTotals(compareArtistInfo) : null;

    const followersChartData = {
        labels: [
            artistInfo?.artistname || 'Current Artist',
            compareArtistInfo?.artistname || 'Comparison Artist'
        ],
        datasets: [
            {
                label: 'Followers',
                data: [
                    artistInfo?.follower_count || 0,
                    compareArtistInfo?.follower_count || 0,
                ],
                backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                borderWidth: 1,
            },
        ],
    };

    // Chart data for Total Likes
    const likesChartData = {
        labels: [
            artistInfo?.artistname || 'Current Artist',
            compareArtistInfo?.artistname || 'Comparison Artist'
        ],
        datasets: [
            {
                label: 'Total Likes',
                data: [
                    totals.totalLikes || 0,
                    comparisonTotals?.totalLikes || 0,
                ],
                backgroundColor: ['rgba(255, 159, 64, 0.5)', 'rgba(75, 192, 192, 0.5)'],
                borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)'],
                borderWidth: 1,
            },
        ],
    };

    // Chart data for Total Play Count
    const playsChartData = {
        labels: [
            artistInfo?.artistname || 'Current Artist',
            compareArtistInfo?.artistname || 'Comparison Artist'
        ],
        datasets: [
            {
                label: 'Total Plays',
                data: [
                    totals.totalPlayCount || 0,
                    comparisonTotals?.totalPlayCount || 0,
                ],
                backgroundColor: ['rgba(153, 102, 255, 0.5)', 'rgba(255, 205, 86, 0.5)'],
                borderColor: ['rgba(153, 102, 255, 1)', 'rgba(255, 205, 86, 1)'],
                borderWidth: 1,
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
            fetchArtistInfo(artistId);
            fetchSongs(artistId);
            fetchPlatformActivity();
        }
    }, [dateFilter, artistId, fetchPlatformActivity]); // Add fetchPlatformActivity as a dependency

    useEffect(() => {
        if (artistId) {
            fetchPlatformActivity();
        }
    }, [dateRange.startDate, dateRange.endDate, artistId, fetchPlatformActivity]);

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
                                <td className="date-cell"
                                style={{ color: 'black' }}>
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

    const handleSearchQueryChange = async (query) => {
        setSearchQuery(query);
    
        // Fetch matching artists if the query is not empty
        if (query.trim() !== '') {
            try {
                const response = await axios.get(`${apiUrl}/artists/search/artistname`, {
                    params: { term: query },
                });
                setSearchResults(response.data);
            } catch (err) {
                console.error('Error fetching artist suggestions:', err);
            }
        } else {
            setSearchResults([]); // Clear suggestions when input is empty
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
    const renderArtistIdInput = () => {
        if (userRole === 'admin') {
            return (
                <div className="input-group">
                    <label>
                        Artist ID:
                        <input
                            type="text"
                            value={artistId}
                            onChange={handleArtistIdChange}
                            placeholder="Enter Artist ID"
                            required
                        />
                    </label>
                </div>
            );
        }
        
        return (
            <div className="input-group">
        <p
            onClick={() =>
                window.open(`/artist/${artistInfo?.artist_id}`, '_blank')
            }
            style={{
                
                color: 'red', // Blue color for a link-like appearance
                padding: '8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textDecoration: 'underline',
            }}
        >
            {artistInfo?.artistname || 'Fetching...'}
        </p>
            </div>
        );
    };
    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
            <h1>Artist Reports</h1>

            <form onSubmit={handleFetchArtistInfo} className="comparison-form">
            {renderArtistIdInput()}
                
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
                                    Search Artist to Compare:
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchQueryChange(e.target.value)}
                                        placeholder="Enter Artist Name"
                                    />
                                    <button type="button" onClick={searchArtists}>
                                        Search
                                    </button>
                                </label>
                                {searchResults.length > 0 && (
                <div className="search-results">
                    <ul>
                        {searchResults.map((artist) => (
                            <li
                                key={artist.artist_id}
                                onClick={() => handleSearchSelect(artist.artist_id, artist.artistname)}
                                style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #ccc' }}
                            >
                                {artist.artistname}
                            </li>
                        ))}
                    </ul>
                </div>
                        )}
                        {compareArtistName && (
                            <p style={{ marginTop: '10px' }}>
                                Selected Artist for Comparison: <strong>{compareArtistName}</strong>
                            </p>
                        )}
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

                    {artistInfo && (
                    <div className="chart-row">
                        <div className="chart-box">
                            <h3>Total Followers</h3>
                            <Bar data={followersChartData} options={{ ...chartOptions, title: { text: 'Followers' } }} />
                        </div>

                        <div className="chart-box">
                            <h3>Total Likes</h3>
                            <Bar data={likesChartData} options={{ ...chartOptions, title: { text: 'Likes' } }} />
                        </div>

                        <div className="chart-box">
                            <h3>Total Plays</h3>
                            <Bar data={playsChartData} options={{ ...chartOptions, title: { text: 'Plays' } }} />
                        </div>
                    </div>
                )}
            </>
        )}
    </div>
);
};


export default ArtistReports;