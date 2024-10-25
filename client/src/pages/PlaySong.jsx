import React from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';

const PlaySong = () => {
    const { songId } = useParams();
    const audioSrc = `http://localhost:3360/artists/play/${songId}`;

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
        </div>
    );
};

export default PlaySong;
