import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

const getMonthRange = (year, month) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

const getPastYearRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

const ListenerReports = () => {
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
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    const handleDateRangeChange = (option) => {
        setDateRangeOption(option);
        if (option === "currentMonth") {
            const currentMonthRange = getCurrentMonthRange();
            setStartDate(currentMonthRange.startDate);
            setEndDate(currentMonthRange.endDate);
        } else if (option === "pastYear") {
            const pastYearRange = getPastYearRange();
            setStartDate(pastYearRange.startDate);
            setEndDate(pastYearRange.endDate);
        }
    };

    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        const { startDate, endDate } = getMonthRange(new Date().getFullYear(), month);
        setStartDate(startDate);
        setEndDate(endDate);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const songRes = await axios.get(`http://localhost:3360/artists/songs/top10`, {
                    params: { 
                        limit: songLimit, 
                        sortOrder: sortOrder, 
                        dateRangeOption: dateRangeOption,  // Pass date range option to backend
                        ...(dateRangeOption !== "currentMonth" && startDate && endDate ? { start_date: startDate, end_date: endDate } : {})
                    }
                });
                
                if (songRes.data && Array.isArray(songRes.data)) {
                    setTopSongs(songRes.data);
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
    
    // Month names for display in the dropdown
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    const genreData = {
        labels: mostPlayedGenres.map(genre => genre.genre_type),
        datasets: [
            {
                data: mostPlayedGenres.map(genre => genre.total_play_count),
                backgroundColor: [
                    '#FF6384', '#FFA500', '#FFCE56', '#8A2BE2', '#FF4500',
                    '#32CD32', '#FFD700', '#1E90FF', '#FF1493', '#00FA9A',
                    '#4B0082', '#00CED1'
                ],
                hoverBackgroundColor: [
                    '#FF6384', '#FFA500', '#FFCE56', '#8A2BE2', '#FF4500',
                    '#32CD32', '#FFD700', '#1E90FF', '#FF1493', '#00FA9A',
                    '#4B0082', '#00CED1'
                ],
            },
        ],
    };
    

    const artistLabels = topArtists.map(artist => artist.artistname);
    const likesData = topArtists.map(artist => artist.total_likes);
    const playCountsData = topArtists.map(artist =>artist.total_play_count);
    const followersData = topArtists.map(artist => artist.follower_count);

    const artistTrendData = {
        
        labels: artistLabels, // Ensure this is an array of artist names or some identifying label
        datasets: [
            {
                label: 'Likes',
                data: likesData, // Ensure this is an array of numeric values matching `artistLabels` length
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
                tension: 0.1,
            },
            {
                label: 'Play Count',
                data: playCountsData, // Ensure this is an array of numeric values matching `artistLabels` length
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: false,
                tension: 0.1,
            },
            {
                label: 'Followers',
                data: followersData, // Data for followers
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                fill: false,
                tension: 0.1,
            },
        ],
    };    

    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/artist');
    };

    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
            <h1>Monthly Reports</h1>

            <section>
                <h2>Date Range</h2>
                <label>
                    <p>Select Date Range:</p>
                    <select value={dateRangeOption} onChange={(e) => handleDateRangeChange(e.target.value)}>
                        <option value="currentMonth">Current Month</option>
                        <option value="pastMonth">Past Month</option>
                        <option value="pastYear">Past Year</option>
                    </select>
                </label>

                {dateRangeOption === "pastMonth" && (
                    <label>
                        <p>Select Month:</p>
                        <select value={selectedMonth} onChange={(e) => handleMonthChange(parseInt(e.target.value))}>
                            {monthNames.map((month, index) => (
                                <option key={index} value={index}>{month}</option>
                            ))}
                        </select>
                    </label>
                )}
            </section>
            <section>
                <h2>Top Songs for {dateRangeOption === "pastMonth" && monthNames[selectedMonth]}</h2>
                <label>
                    <p>Song Limit:</p>
                    <input
                        type="number"
                        value={songLimit}
                        onChange={(e) => setSongLimit(parseInt(e.target.value) || 10)}
                    />
                </label>
                <label>
                    <p>Sort Order:</p>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="most">Most</option>
                        <option value="least">Least</option>
                    </select>
                </label>
                {topSongs.length > 0 ? (
                    <ul>
                        {topSongs.map(song => (
                            <li key={song.song_id}>
                                <strong>{song.title}</strong> - 
                                {dateRangeOption === "pastMonth" ? 
                                    (song.total_play_count || 0) : (song.play_count || 0)} plays, 
                                {dateRangeOption === "pastMonth" ? 
                                    (song.total_likes || 0) : (song.likes || 0)} likes
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No top songs available.</p>
                )}
            </section>


            <section>
                <h2>Top Artists for {dateRangeOption === "pastMonth" && monthNames[selectedMonth]}</h2>
                <label>
                    <p>Artist Limit:</p>
                    <input
                        type="number"
                        value={artistLimit}
                        onChange={(e) => setArtistLimit(parseInt(e.target.value) || 10)}
                    />
                </label>
                <label>
                    <p>Sort Order:</p>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="most">Most</option>
                        <option value="least">Least</option>
                    </select>
                </label>
                <ul>
                {topArtists.map(artist => (
                    <li key={artist.artist_id}>
                        {artist.artistname}: {artist.most_played_song_title || 'No Data'} 
                        (Plays: {artist.total_play_count || artist.play_count || 0}) {/* Adjusted here */}
                    </li>
                ))}
                </ul>

                <Line data={artistTrendData} options={{ responsive: true }} />
            </section>

            <section>
                <h2>Most Played Genres for {dateRangeOption === "pastMonth" && monthNames[selectedMonth]}</h2>
                {mostPlayedGenres.length > 0 ? (
                    <div className="chart-container">
                        <Pie data={genreData} />
                    </div>
                ) : (
                    <p>No genre play data available.</p>
                )}
            </section>
        </div>
    );
};

export default ListenerReports;