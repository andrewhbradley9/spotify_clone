import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';

import { Pie, Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

const defaultColor = '#FF8C00'; // Bright Orange

const colorMapping = {
    'Rock': '#FF6384',
    'Pop': '#FFA500',
    'Rap': '#FFCE56',
    'Classical': '#8A2BE2',
    'Hip-Hop': '#FF4500',
    'Jazz': '#32CD32',
    'Country': '#FFD700',
    'Electronic': '#1E90FF',
    'Blues': '#FF1493',
    'Reggae': '#00FA9A',
    'Metal': '#4B0082',
    'Alternative': '#00CED1',
};
const ListenerReports = () => {
    const [releaseDateSortOrder, setReleaseDateSortOrder] = useState('desc'); // Default: Most recent first
    const [searchQuery, setSearchQuery] = useState('');
    const [artistTrendData, setArtistTrendData] = useState(null);
    const [filteredSongs, setFilteredSongs] = useState([]); 
    const [selectedGenre, setSelectedGenre] = useState(null); 
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [followerCountSortOrder, setFollowerCountSortOrder] = useState('desc');
    const [likesSortOrder, setLikesSortOrder] = useState('desc');
    const [playCountSortOrder, setPlayCountSortOrder] = useState('desc');
    const [songNameSortOrder, setSongNameSortOrder] = useState('asc'); // Default A-Z
    const [artistNameSortOrder, setArtistNameSortOrder] = useState('asc'); // Default A-Z
    const [topSongs, setTopSongs] = useState([]);
    const [topArtists, setTopArtists] = useState([]);
    const [songLimit, setSongLimit] = useState(10); 
    const [artistLimit, setArtistLimit] = useState(10); 
    const [sortOrder, setSortOrder] = useState("most");
    const [mostPlayedGenres, setMostPlayedGenres] = useState([]);
    const { startDate: defaultStartDate, endDate: defaultEndDate } = getCurrentMonthRange();
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [dateRangeOption, setDateRangeOption] = useState("currentMonth");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const songRes = await axios.get(`http://localhost:3360/artists/songs/top10`, {
                    params: { 
                        limit: songLimit, 
                        sortOrder: sortOrder, 
                        dateRangeOption: dateRangeOption, 
                        ...(dateRangeOption !== "currentMonth" && startDate && endDate ? { start_date: startDate, end_date: endDate } : {})
                    }
                });
    
                if (songRes.data && Array.isArray(songRes.data)) {
                    setTopSongs(songRes.data);
                    setFilteredSongs(songRes.data); // Sync filteredSongs with topSongs initially
                    updateArtistTrendData(songRes.data); // Update the chart data immediately
                }
    
                const topArtistRes = await axios.get(`http://localhost:3360/artists/artists/top10`, {
                    params: { 
                        limit: artistLimit, 
                        sortOrder: sortOrder, 
                        ...(dateRangeOption !== "currentMonth" && startDate && endDate ? { start_date: startDate, end_date: endDate } : {})
                    },
                });
                if (topArtistRes.data && Array.isArray(topArtistRes.data)) {
                    setTopArtists(topArtistRes.data);
                }
    
                const genreRes = await axios.get(`http://localhost:3360/artists/most-played/genres`, {
                    params: {
                        ...(dateRangeOption !== "currentMonth" && startDate && endDate ? { start_date: startDate, end_date: endDate } : {})
                    }
                });
                if (genreRes.data && Array.isArray(genreRes.data)) {
                    setMostPlayedGenres(genreRes.data);
                }
            } catch (err) {
                console.log("Error fetching data:", err);
            }
        };
    
        fetchData();
    }, [songLimit, artistLimit, sortOrder, startDate, endDate, dateRangeOption]);
    
    const calculateGenreData = () => {
        const genreCounts = filteredSongs.reduce((acc, song) => {
            if (song.genre_type) {
                acc[song.genre_type] = (acc[song.genre_type] || 0) + song.play_count;
            }
            return acc;
        }, {});
    
        const labels = Object.keys(genreCounts); // Genres in the table
        const data = Object.values(genreCounts); // Total play counts
    
        const backgroundColor = labels.map(
            (label) => colorMapping[label] || defaultColor
        );
    
        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor,
                    hoverBackgroundColor: backgroundColor,
                },
            ],
        };
    };
    
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
    
        const searchFilteredSongs = topSongs.filter((song) => 
            Object.values(song).some((value) => 
                value?.toString().toLowerCase().includes(query.toLowerCase())
            )
        );
    
        setFilteredSongs(
            selectedGenre === 'All Genres'
                ? searchFilteredSongs // Show all matching songs if "All" genre is selected
                : searchFilteredSongs.filter((song) => song.genre_type === selectedGenre) // Filter by genre if selected
        );
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'; // Handle missing dates
        const date = new Date(dateString);
        const options = { month: '2-digit', day: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('en-US', options); // Format as MM/DD/YYYY
    };
    
    const updateArtistTrendData = (songs) => {
        // Dynamically generate chart data from sorted songs
        setArtistTrendData({
            labels: songs.map((song) => song.artistname || "Unknown Artist"),
            datasets: [
                {
                    label: 'Likes',
                    data: songs.map((song) => song.likes || 0),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false,
                    tension: 0.1,
                },
                {
                    label: 'Play Count',
                    data: songs.map((song) => song.play_count || 0),
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: false,
                    tension: 0.1,
                },
                {
                    label: 'Followers',
                    data: songs.map((song) => song.follower_count || 0),
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    fill: false,
                    tension: 0.1,
                },
            ],
        });
    };

    const handleSort = (songs, key, sortOrder) => {
        const sortedSongs = [...songs].sort((a, b) => {
            if (key === 'song_releasedate') {
                const dateA = new Date(a[key]);
                const dateB = new Date(b[key]);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            }
    
            if (sortOrder === 'asc') {
                return a[key] > b[key] ? 1 : -1;
            } else {
                return a[key] < b[key] ? 1 : -1;
            }
        });
    
        updateArtistTrendData(sortedSongs); // Update chart data
        return sortedSongs;
    };
    
    const GenreDropdownMenu = ({ genres, position, onClose, onSelect }) => (
        ReactDOM.createPortal(
            <div
                style={{
                    position: 'absolute',
                    top: position.top,
                    left: position.left,
                    backgroundColor: '#ffffff',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    padding: '10px',
                    zIndex: 1000,
                    minWidth: '150px',
                }}
            >
                <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                    {genres.map((genre, index) => (
                        <li
                            key={index}
                            style={{
                                padding: '5px 10px',
                                cursor: 'pointer',
                                borderBottom: index !== genres.length - 1 ? '1px solid #ddd' : 'none',
                            }}
                            onClick={() => onSelect(genre)}
                        >
                            {genre}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onClose}
                    style={{
                        display: 'block',
                        width: '100%',
                        marginTop: '10px',
                        backgroundColor: '#f5f5f5',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '5px',
                        cursor: 'pointer',
                        textAlign: 'center',
                    }}
                >
                    Close
                </button>
            </div>,
            document.body
        )
    );
    const filterByDateRange = () => {
        if (!startDate || !endDate) {
            alert('Please specify both start and end dates.');
            return;
        }
    
        const filtered = topSongs.filter((song) => {
            const releaseDate = new Date(song.song_releasedate);
            return (
                releaseDate >= new Date(startDate) &&
                releaseDate <= new Date(endDate)
            );
        });
    
        setFilteredSongs(filtered);
    };
    
const handleGenreSelect = (genre) => {
    setSelectedGenre(genre); // Update selected genre
    setIsDropdownOpen(false); // Close dropdown

    // Filter songs by the selected genre
    const genreFilteredSongs = genre === "All Genres" 
        ? topSongs // Show all songs if "All" is selected
        : topSongs.filter((song) => song.genre_type === genre);

    setFilteredSongs(genreFilteredSongs); // Update table data
    updateArtistTrendData(genreFilteredSongs); // Update chart data
};

    const handleGenreClick = (event) => {
        const rect = event.target.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
        setIsDropdownOpen((prev) => !prev); // Toggle dropdown visibility
    };
    const renderCombinedTable = (artists, songs) => {
        const isEnglish = (text) =>
            /^[A-Za-z0-9\s'!"#$%&()*+,\-.\/:;<=>?@[\\\]^_`{|}~]*$/.test(text);
    
        const validSongs = filteredSongs && filteredSongs.length > 0 ? filteredSongs : songs || [];
    
        const sortedSongs = [...validSongs].sort((a, b) => {
            if (releaseDateSortOrder) {
                const dateA = new Date(a.song_releasedate);
                const dateB = new Date(b.song_releasedate);
        
                return releaseDateSortOrder === 'desc'
                    ? dateB - dateA // Most recent first
                    : dateA - dateB; // Least recent first
            }

            if (followerCountSortOrder) {
                return followerCountSortOrder === 'desc'
                    ? b.follower_count - a.follower_count
                    : a.follower_count - b.follower_count;
            }
    
            if (likesSortOrder) {
                return likesSortOrder === 'desc'
                    ? b.likes - a.likes
                    : a.likes - b.likes;
            }
    
            if (playCountSortOrder) {
                return playCountSortOrder === 'desc'
                    ? b.play_count - a.play_count
                    : a.play_count - b.play_count;
            }
    
            if (artistNameSortOrder) {
                return artistNameSortOrder === 'asc'
                    ? a.artistname.localeCompare(b.artistname, 'default', { sensitivity: 'base' })
                    : b.artistname.localeCompare(a.artistname, 'default', { sensitivity: 'base' });
            }
    
            if (songNameSortOrder) {
                const aTitleIsEnglish = isEnglish(a.title);
                const bTitleIsEnglish = isEnglish(b.title);
    
                if (aTitleIsEnglish && bTitleIsEnglish) {
                    return songNameSortOrder === 'asc'
                        ? a.title.localeCompare(b.title, 'default', { sensitivity: 'base' })
                        : b.title.localeCompare(a.title, 'default', { sensitivity: 'base' });
                }
    
                if (!aTitleIsEnglish && bTitleIsEnglish) {
                    return songNameSortOrder === 'asc'
                        ? a.artistname.localeCompare(b.artistname, 'default', { sensitivity: 'base' })
                        : b.artistname.localeCompare(a.artistname, 'default', { sensitivity: 'base' });
                }
    
                if (aTitleIsEnglish && !bTitleIsEnglish) {
                    return songNameSortOrder === 'asc'
                        ? b.artistname.localeCompare(a.artistname, 'default', { sensitivity: 'base' })
                        : a.artistname.localeCompare(b.artistname, 'default', { sensitivity: 'base' });
                }
    
                return songNameSortOrder === 'asc'
                    ? a.artistname.localeCompare(b.artistname, 'default', { sensitivity: 'base' })
                    : b.artistname.localeCompare(a.artistname, 'default', { sensitivity: 'base' });
            }
    
            return 0;
        });
    
        return (
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th
                                onClick={() => {
                                    const newSortOrder = artistNameSortOrder === 'asc' ? 'desc' : 'asc'; 
                                    setArtistNameSortOrder(newSortOrder);
                                    setSongNameSortOrder(null);
                                    setPlayCountSortOrder(null);
                                    setLikesSortOrder(null);
                                    setFollowerCountSortOrder(null);
                                    setFilteredSongs(handleSort(validSongs, 'artistname', newSortOrder));
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                Artist {artistNameSortOrder === 'asc' ? '▲' : '▼'}
                            </th>
                            <th
                                onClick={() => {
                                    const newSortOrder = songNameSortOrder === 'asc' ? 'desc' : 'asc';
                                    setSongNameSortOrder(newSortOrder);
                                    setArtistNameSortOrder(null);
                                    setPlayCountSortOrder(null);
                                    setLikesSortOrder(null);
                                    setFollowerCountSortOrder(null);
                                    setFilteredSongs(handleSort(validSongs, 'title', newSortOrder));
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                Song Name {songNameSortOrder === 'asc' ? '▲' : '▼'}
                            </th>
                            <th
                                onClick={() => {
                                    const newSortOrder = playCountSortOrder === 'desc' ? 'asc' : 'desc';
                                    setPlayCountSortOrder(newSortOrder);
                                    setArtistNameSortOrder(null);
                                    setSongNameSortOrder(null);
                                    setLikesSortOrder(null);
                                    setFollowerCountSortOrder(null);
                                    setFilteredSongs(handleSort(validSongs, 'play_count', newSortOrder));
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                Play Count {playCountSortOrder === 'desc' ? '▼' : '▲'}
                            </th>
                            <th
                                onClick={() => {
                                    const newSortOrder = likesSortOrder === 'desc' ? 'asc' : 'desc';
                                    setLikesSortOrder(newSortOrder);
                                    setPlayCountSortOrder(null);
                                    setArtistNameSortOrder(null);
                                    setSongNameSortOrder(null);
                                    setFollowerCountSortOrder(null);
                                    setFilteredSongs(handleSort(validSongs, 'likes', newSortOrder));
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                Likes {likesSortOrder === 'desc' ? '▼' : '▲'}
                            </th>
                            <th
                                onClick={() => {
                                    const newSortOrder = followerCountSortOrder === 'desc' ? 'asc' : 'desc';
                                    setFollowerCountSortOrder(newSortOrder);
                                    setLikesSortOrder(null);
                                    setPlayCountSortOrder(null);
                                    setArtistNameSortOrder(null);
                                    setSongNameSortOrder(null);
                                    setFilteredSongs(handleSort(validSongs, 'follower_count', newSortOrder));
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                Follower Count {followerCountSortOrder === 'desc' ? '▼' : '▲'}
                            </th>
                            <th
                            onClick={handleGenreClick}
                            style={{ cursor: 'pointer', color: '#fff', textDecoration: 'underline' }}
                        >
                            {selectedGenre || 'All Genres ▼'}
                        </th>
                            <th
                                onClick={() => {
                                    const newSortOrder = releaseDateSortOrder === 'desc' ? 'asc' : 'desc';
                                    setReleaseDateSortOrder(newSortOrder); // Update sort order
                                    setFilteredSongs(handleSort(validSongs, 'song_releasedate', newSortOrder));
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                Release Date {releaseDateSortOrder === 'desc' ? '▼' : '▲'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSongs.map((song) => (
                            <tr key={song.song_id}>
                                <td>{song.artistname || 'N/A'}</td>
                                <td>{song.title || 'N/A'}</td>
                                <td>{song.play_count || 0}</td>
                                <td>{song.likes || 0}</td>
                                <td>{song.follower_count || 'N/A'}</td>
                                <td>{song.genre_type || 'N/A'}</td>
                                <td>{formatDate(song.song_releasedate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };
    
    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/artist');
    };

    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
            <h1>Monthly Reports</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
    <div>
        <label>
            Start Date:
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ marginLeft: '10px', marginRight: '20px' }}
            />
        </label>
    </div>
    <div>
        <label>
            End Date:
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ marginLeft: '10px' }}
            />
        </label>
        <button
            onClick={() => filterByDateRange()}
            style={{
                marginLeft: '20px',
                padding: '5px 15px',
                cursor: 'pointer',
                backgroundColor: '#ff0000',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
            }}
        >
            Filter
        </button>
        <button
        onClick={() => {
            setStartDate(defaultStartDate); // Reset start date
            setEndDate(defaultEndDate); // Reset end date
            setSearchQuery(''); // Reset search query
            setFilteredSongs(topSongs); // Reset filtered songs to all top songs
        }}
        style={{
            marginLeft: '10px',
            padding: '5px 15px',
            cursor: 'pointer',
            backgroundColor: '#008CBA',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
        }}
    >
        Reset Filters
    </button>
    </div>
</div>

            <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearch}
                style={{ marginBottom: 10, padding: 5, width: '100%' }}
            />
            <section>
    {renderCombinedTable(topSongs)}
</section>


{isDropdownOpen && (
    <GenreDropdownMenu
        genres={['All Genres', ...new Set(topSongs.map((song) => song.genre_type))]} // Include "All" option
        position={dropdownPosition}
        onClose={() => setIsDropdownOpen(false)}
        onSelect={handleGenreSelect}
    />
)}
<section>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div style={{ flex: 1, marginRight: '10px' }}>
            <h2>Most Played Genres</h2>
            {filteredSongs.length > 0 ? (
                <div className="chart-container">
                    <Pie data={calculateGenreData()} />
                </div>
            ) : (
                <p>No genre play data available.</p>
            )}
        </div>
        <div style={{ flex: 1, marginLeft: '10px' }}>
            <h2>Artist Trends</h2>
            {artistTrendData ? (
                <Line data={artistTrendData} options={{ responsive: true }} />
            ) : (
                <p>Loading trend data...</p>
            )}
        </div>
    </div>
</section>

        </div>
    );
};

export default ListenerReports;