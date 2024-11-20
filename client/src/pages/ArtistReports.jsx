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
    const userRole = localStorage.getItem('role');
    const [artistId, setArtistId] = useState('');
    const [compareArtistId, setCompareArtistId] = useState('');
    const [artistInfo, setArtistInfo] = useState(null);
    const [compareArtistInfo, setCompareArtistInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [compareArtistName, setCompareArtistName] = useState('');
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
        if (artistId) {
            fetchArtistInfo(artistId);
            fetchSongs(artistId);
            fetchAlbums(artistId);
        }
    }, [artistId]);
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
            await fetchAlbums(artistId);
            
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

    // Update the calculateTotals function
    const calculateTotals = (artist) => {
        if (!artist) return { totalLikes: 0, totalPlayCount: 0 };
        
        // Calculate totals from the songs array instead of albums
        let totalLikes = 0;
        let totalPlayCount = 0;

        // Check if we have songs data
        if (songs && songs.length > 0) {
            songs.forEach(song => {
                totalLikes += parseInt(song.total_likes) || 0;
                totalPlayCount += parseInt(song.total_play_count) || 0;
            });
        }

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

    // Add new state for albums
    const [albums, setAlbums] = useState([]);

    // Add function to fetch albums
    const fetchAlbums = async (id) => {
        try {
            const response = await axios.get(`${apiUrl}/artists/albums/${id}`);
            console.log("Albums data received:", response.data);
            setAlbums(response.data);
        } catch (err) {
            console.error("Error fetching albums:", err);
        }
    };

    // Add these state variables at the top
    const [sortConfig, setSortConfig] = useState({
        field: null,
        direction: 'asc'
    });

    // Add this performance score calculation function
    const calculatePerformanceScore = (song) => {
        // Base metrics
        const playCount = song.total_play_count || 0;
        const likes = song.total_likes || 0;
        
        // Weights for different metrics
        const PLAY_WEIGHT = 1;
        const LIKE_WEIGHT = 2;  // Likes are weighted more heavily than plays
        
        // Calculate weighted score
        const performanceScore = (playCount * PLAY_WEIGHT) + (likes * LIKE_WEIGHT);
        
        return performanceScore;
    };

    // Update the sorting function to use the correct field names
    const handleSort = (field) => {
        let direction = 'asc';
        if (sortConfig.field === field && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ field, direction });
    };

    // Update the renderSongsTable function to use the correct field names
    const renderSongsTable = () => {
        let sortedSongs = [...songs];
        
        if (sortConfig.field) {
            sortedSongs.sort((a, b) => {
                if (sortConfig.field === 'performanceScore') {
                    const scoreA = calculatePerformanceScore(a);
                    const scoreB = calculatePerformanceScore(b);
                    return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
                }
                
                // Map the field names to the actual properties in the song object
                const fieldMap = {
                    'play_count': 'total_play_count',
                    'likes': 'total_likes'
                };
                
                const field = fieldMap[sortConfig.field] || sortConfig.field;
                const valueA = a[field] || 0;
                const valueB = b[field] || 0;
                return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
            });
        }

        return (
            <table className="artist-table">
                <thead>
                    <tr>
                        <th>Song Title</th>
                        <th>Album</th>
                        <th>Duration</th>
                        <th onClick={() => handleSort('play_count')} style={{ cursor: 'pointer' }}>
                            Play Count {renderSortArrow('play_count')}
                        </th>
                        <th onClick={() => handleSort('likes')} style={{ cursor: 'pointer' }}>
                            Likes {renderSortArrow('likes')}
                        </th>
                        <th onClick={() => handleSort('performanceScore')} style={{ cursor: 'pointer' }}>
                            Performance Score {renderSortArrow('performanceScore')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedSongs.map(song => (
                        <tr key={song.song_id}>
                            <td>{song.song_title}</td>
                            <td>{song.album_name}</td>
                            <td>{song.duration}</td>
                            <td>{song.total_play_count || 0}</td>
                            <td>{song.total_likes || 0}</td>
                            <td>{calculatePerformanceScore(song)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    // Add this helper function to render the sort arrows
    const renderSortArrow = (field) => {
        if (sortConfig.field !== field) {
            return '↕️';
        }
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Add this function to handle date changes
    const handleDateChange = (key, value) => {
        setDateRange(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const [activeTab, setActiveTab] = useState('overview');

    // Modify prepareLineChartData to accept a comparison flag
    const prepareLineChartData = (artistInfo, compareArtistInfo = null, isComparison = false) => {
        const datasets = [];
        
        if (artistInfo) {
            datasets.push({
                label: artistInfo.artistname,
                data: [
                    artistInfo.follower_count,
                    calculateTotals(artistInfo).totalLikes,
                    calculateTotals(artistInfo).totalPlayCount
                ],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4
            });
        }

        // Only add comparison data if it's the comparison tab
        if (compareArtistInfo && isComparison) {
            datasets.push({
                label: compareArtistInfo.artistname,
                data: [
                    compareArtistInfo.follower_count,
                    calculateTotals(compareArtistInfo).totalLikes,
                    calculateTotals(compareArtistInfo).totalPlayCount
                ],
                borderColor: 'rgba(53, 162, 235, 1)',
                backgroundColor: 'rgba(53, 162, 235, 0.2)',
                tension: 0.4
            });
        }

        return {
            labels: ['Followers', 'Total Likes', 'Total Play Count'],
            datasets
        };
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="tab-content">
                        <table className="artist-table">
                            <thead>
                                <tr>
                                    <th colSpan="2">Artist Information</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th>Artist Name</th>
                                    <td>{artistInfo?.artistname}</td>
                                </tr>
                                <tr>
                                    <th>Bio</th>
                                    <td>{artistInfo?.artist_bio}</td>
                                </tr>
                                <tr>
                                    <th>Genre</th>
                                    <td>{artistInfo?.genre_type}</td>
                                </tr>
                                <tr>
                                    <th>Followers</th>
                                    <td>{artistInfo?.follower_count}</td>
                                </tr>
                                <tr>
                                    <th>Verified</th>
                                    <td>{artistInfo?.is_verified ? 'Yes' : 'No'}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="albums-section">
                            <h3>Albums</h3>
                            <table className="artist-table">
                                <thead>
                                    <tr>
                                        <th>Album Name</th>
                                        <th>Release Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {albums.map(album => (
                                        <tr key={album.album_id}>
                                            <td>{album.album_name}</td>
                                            <td>{new Date(album.release_date).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="charts-container">
                            <div className="chart-container">
                                <h3>Performance Overview - Bar Chart</h3>
                                <Bar 
                                    data={{
                                        labels: ['Followers', 'Total Likes', 'Total Play Count'],
                                        datasets: [{
                                            label: artistInfo?.artistname,
                                            data: artistInfo ? [
                                                artistInfo.follower_count,
                                                calculateTotals(artistInfo).totalLikes,
                                                calculateTotals(artistInfo).totalPlayCount
                                            ] : [],
                                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                            borderColor: 'rgba(255, 99, 132, 1)',
                                            borderWidth: 1,
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </div>

                            <div className="chart-container">
                                <h3>Performance Overview - Line Chart</h3>
                                <Line 
                                    data={prepareLineChartData(artistInfo, null, false)}
                                    options={{
                                        ...chartOptions,
                                        elements: {
                                            line: {
                                                borderWidth: 2
                                            },
                                            point: {
                                                radius: 6,
                                                hoverRadius: 8
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'songs':
                return (
                    <div className="tab-content">
                        <h3>Songs Performance</h3>
                        {renderSongsTable()}
                    </div>
                );

            case 'activity':
                return (
                    <div className="tab-content">
                        {renderActivityTable()}
                    </div>
                );

            case 'comparison':
                return (
                    <div className="tab-content">
                        <div className="comparison-form">
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
                            </div>
                        </div>
                        
                        {compareArtistInfo && (
                            <div className="charts-container">
                                {/* Bar Chart */}
                                <div className="chart-container">
                                    <h3>Artist Comparison - Bar Chart</h3>
                                    <Bar data={comparisonChartData} options={chartOptions} />
                                </div>

                                {/* Line Chart */}
                                <div className="chart-container">
                                    <h3>Artist Comparison - Line Chart</h3>
                                    <Line 
                                        data={prepareLineChartData(artistInfo, compareArtistInfo, true)}
                                        options={{
                                            ...chartOptions,
                                            elements: {
                                                line: {
                                                    borderWidth: 2
                                                },
                                                point: {
                                                    radius: 6,
                                                    hoverRadius: 8
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
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
                        <p onClick={() =>
                window.open(`/artist/${artistInfo?.artist_id}`, '_blank')
            }
            style={{
                
                color: 'red', // Blue color for a link-like appearance
                padding: '8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textDecoration: 'underline',
            }}>{artistInfo?.artistname || 'Fetching...'}</p>
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
                    <div className="tab-navigation">
                        <button 
                            className={activeTab === 'overview' ? 'active-tab' : ''}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button 
                            className={activeTab === 'songs' ? 'active-tab' : ''}
                            onClick={() => setActiveTab('songs')}
                        >
                            Songs Performance
                        </button>
                        <button 
                            className={activeTab === 'activity' ? 'active-tab' : ''}
                            onClick={() => setActiveTab('activity')}
                        >
                            Recent Activity
                        </button>
                        <button 
                            className={activeTab === 'comparison' ? 'active-tab' : ''}
                            onClick={() => setActiveTab('comparison')}
                        >
                            Artist Comparison
                        </button>
                    </div>

                    {renderTabContent()}
                </>
            )}
        </div>
    );
};


export default ArtistReports;