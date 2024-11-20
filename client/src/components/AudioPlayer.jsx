import React, { useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';

const AudioPlayer = () => {
    const { currentSong, isPlaying, playSong, pauseSong, audioElement, closePlayer } = useAudio();
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Check if user is logged in
    const authToken = localStorage.getItem('token');

    useEffect(() => {
        if (!authToken) {
            closePlayer(); // Close the player if the user is logged out
        }
    }, [authToken, closePlayer]);

    useEffect(() => {
        const handleTimeUpdate = () => {
            setProgress(audioElement.currentTime);
            setDuration(audioElement.duration);
        };

        audioElement.addEventListener('timeupdate', handleTimeUpdate);
        audioElement.addEventListener('loadedmetadata', handleTimeUpdate);

        return () => {
            audioElement.removeEventListener('timeupdate', handleTimeUpdate);
            audioElement.removeEventListener('loadedmetadata', handleTimeUpdate);
        };
    }, [audioElement]);

    const formatTime = (time) => {
        if (!time) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleProgressChange = (e) => {
        const newTime = e.target.value;
        audioElement.currentTime = newTime;
        setProgress(newTime);
    };

    // Do not render if there's no song or user is not logged in
    if (!currentSong || !authToken) return null;

    return (
        <div className="audio-player">
            <div className="song-info">
                {currentSong.songimage && (
                    <img src={currentSong.songimage} alt={currentSong.title} />
                )}
                <div className="song-details">
                    <h4>{currentSong.title}</h4>
                    <p>{currentSong.artistname}</p>
                </div>
            </div>
            <div className="player-controls">
                <button 
                    onClick={() => (isPlaying ? pauseSong() : playSong(currentSong))}
                    className="play-button"
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <div className="progress-container">
                    <span className="time">{formatTime(progress)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={progress}
                        onChange={handleProgressChange}
                        className="progress-bar"
                    />
                    <span className="time">{formatTime(duration)}</span>
                </div>
            </div>
            <button onClick={closePlayer} className="close-button">×</button>
        </div>
    );
};

export default AudioPlayer;
