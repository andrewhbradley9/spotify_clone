import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

const PlaySong = () => {
    const { songId } = useParams();
    const navigate = useNavigate();
    const [songUrl, setSongUrl] = useState(null);

    useEffect(() => {
        const fetchSong = async () => {
            try {
                const res = await axios.get(`${apiUrl}/artists/play/${songId}`, {
                    responseType: 'blob'
                });
                setSongUrl(URL.createObjectURL(res.data));
            } catch (err) {
                console.error("Error fetching song:", err);
            }
        };
        fetchSong();
    }, [songId]);

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>Now Playing</h2>
            {songUrl ? (
                <ReactPlayer 
                    url={songUrl} 
                    playing 
                    controls 
                    width='100%' 
                    height='50px' 
                />
            ) : (
                <p>Loading song...</p>
            )}
            <p style={{ marginTop: '10px' }}>Enjoy the music!</p>

            {/* Buttons with inline styles */}
            <button 
                style={{
                    backgroundColor: '#4CAF50', // Green
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    margin: '4px',
                }}
                onClick={handleGoHome}
            >
                Back to Artists
            </button>

            <button 
                style={{
                    backgroundColor: '#2196F3', // Blue
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    margin: '4px',
                }}
            >
                <Link to={`/albums/${songId}`} style={{ color: 'white', textDecoration: 'none' }}>Back to Album</Link>
            </button>

            <button 
                style={{
                    backgroundColor: '#f44336', // Red
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    margin: '4px',
                }}
            >
                <Link to={`/search/song`} style={{ color: 'white', textDecoration: 'none' }}>Search Song</Link>
            </button>
        </div>
    );
};

export default PlaySong;
