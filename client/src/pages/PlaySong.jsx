import React from 'react';
import ReactPlayer from 'react-player';
import { useParams, useNavigate,Link  } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;



const PlaySong = () => {
    const { songId } = useParams();
    const audioSrc = `${apiUrl}/artists/play/${songId}`;
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

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
            <button className="cancel"><Link to={`/albums/:albumId/songs/:artistId`}>Back to Album</Link></button>
            <p><button className="cancel"><Link to={`/search/song`}>Search Song</Link></button></p>
            <div><p><button className="cancel" onClick={handleGoHome}>Back to Artists</button></p></div>
        </div>
    );
};

export default PlaySong;
