import React, { useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useParams, useNavigate, Link } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;
const PlaySong = () => {
    const { songId, albumId } = useParams(); // Get songId and albumId from params
    const audioSrc = `${apiUrl}/artists/play/${albumId}/${songId}`;
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/'); // Navigate to the main page
    };

    useEffect(() => {
        const incrementPlayCount = async () => {
            try {
                await fetch(`${apiUrl}/artists/songs/increment-play-count/${songId}`, {
                    method: 'POST',
                });
            } catch (error) {
                console.error("Error incrementing play count:", error);
            }
        };

        incrementPlayCount(); // Call function to increment play count when the component mounts
    }, [songId]); // Add songId to the dependency array

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>Now Playing</h2>
            <ReactPlayer 
                url={audioSrc} 
                playing 
                controls 
                width='100%' 
                height='50px' 
            />
            <p style={{ marginTop: '10px' }}>Enjoy the music!</p>
            <button className="cancel">
                <Link to={`/albums/${albumId}/songs/${songId}`}>Back to Album</Link>
            </button>
            <p>
                <button className="cancel">
                    <Link to={`/search/song`}>Search Song</Link>
                </button>
            </p>
            <div>
                <p>
                    <button className="cancel" onClick={handleGoHome}>Back Home</button>
                </p>
            </div>
        </div>
    );
};

export default PlaySong;
