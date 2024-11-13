// ArtistWelcomePage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const ArtistWelcomePage = () => {
    const [artistName, setArtistName] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token found. Please log in.');
            return;
        }

        try {
            // Decode token to get artist name and role
            const decodedToken = jwtDecode(token);
            if (decodedToken.role !== 'artist') {
                setError('Access denied. You are not an artist.');
                return;
            }
            setArtistName(decodedToken.username); // or decodedToken.name if you use name in your token payload
        } catch (error) {
            console.error('Error decoding token:', error);
            setError('Invalid token.');
        }
    }, []);

    const handleDashboardAccess = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3300/artists/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log(response.data.message); // Use this data or display a message
        } catch (error) {
            console.error('Error accessing dashboard:', error);
            setError('Failed to access the artist dashboard.');
        }
    };

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Welcome, {artistName}!</h1>
            <p style={styles.paragraph}>This is your artist dashboard. Here, you can manage your songs, albums, and more!</p>
            <button style={styles.button} onClick={handleDashboardAccess}>
                Go to Dashboard
            </button>
        </div>
    );
};

// Basic styling
const styles = {
    container: {
        textAlign: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        fontSize: '2rem',
        color: '#4A90E2',
    },
    paragraph: {
        fontSize: '1.2rem',
        color: '#555',
        marginBottom: '20px',
    },
    button: {
        padding: '10px 20px',
        fontSize: '1rem',
        color: '#fff',
        backgroundColor: '#4A90E2',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
};

export default ArtistWelcomePage;
