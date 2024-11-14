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
        <div className="player-page">
            <div className="player-content">
                <div className="now-playing-header">
                    <h2>Now Playing</h2>
                    <div className="player-controls">
                        <ReactPlayer 
                            url={audioSrc} 
                            playing 
                            controls 
                            width='100%' 
                            height='50px'
                            className="audio-player"
                        />
                    </div>
                </div>

                <div className="navigation-buttons">
                    <Link to={`/albums/${albumId}/songs/${songId}`} className="nav-button">
                        <span className="material-icons"></span>
                        Back to Album
                    </Link>
                    <Link to="/artist" className="nav-button">
                        <span className="material-icons"></span>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PlaySong;
