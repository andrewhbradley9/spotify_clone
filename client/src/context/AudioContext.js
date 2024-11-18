import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AudioContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL;

export const AudioProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioElement] = useState(new Audio());
    const [isPlayerVisible, setIsPlayerVisible] = useState(true);

    const playSong = async (song) => {
        try {
            // Increment play count
            await axios.post(`${apiUrl}/artists/songs/increment-play-count/${song.song_id}`);
            
            if (currentSong?.song_id === song.song_id) {
                if (isPlaying) {
                    audioElement.pause();
                    setIsPlaying(false);
                } else {
                    audioElement.play();
                    setIsPlaying(true);
                }
            } else {
                audioElement.src = `${apiUrl}/artists/play/${song.album_id}/${song.song_id}`;
                audioElement.play();
                setCurrentSong(song);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error("Error playing song:", error);
        }
    };

    const pauseSong = () => {
        audioElement.pause();
        setIsPlaying(false);
    };

    const closePlayer = () => {
        audioElement.pause();
        setIsPlaying(false);
        setIsPlayerVisible(false);
        setCurrentSong(null);
    };

    // Clean up audio element on unmount
    useEffect(() => {
        return () => {
            audioElement.pause();
            audioElement.src = '';
        };
    }, [audioElement]);

    return (
        <AudioContext.Provider value={{ 
            currentSong, 
            isPlaying, 
            playSong, 
            pauseSong,
            audioElement,
            isPlayerVisible,
            closePlayer
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => useContext(AudioContext); 