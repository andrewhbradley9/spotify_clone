import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams, useNavigate, Link } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;
const PlaySong = () => {
    const { songId, albumId } = useParams(); // Get songId and albumId from params
    const audioSrc = `${apiUrl}/artists/play/${albumId}/${songId}`;
    const navigate = useNavigate();
    const [likes, setLikes] = useState(0);  // Track number of likes for the song
    const [liked, setLiked] = useState(false);  // Track whether the song is liked
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
        const fetchLikeStatus = async () => {
            try {
                const response = await axios.get(`http://localhost:3360/artists/song-likes/${songId}`, {
                    params: { user_id: 1 } // Replace with actual user ID
                });
                console.log(response.data); // Log the full response to inspect it
                setLiked(response.data.isLiked);
                setLikes(isNaN(response.data.likesCount) ? 0 : response.data.likesCount); // Fallback to 0 if NaN
            } catch (error) {
                console.error("Error fetching like status:", error);
            }
        };
        
        incrementPlayCount();
        fetchLikeStatus();
    }, [songId]);
    const handleLike = async () => {
        try {
            const response = await axios.post(`http://localhost:3360/artists/songs/${songId}/like`, { 
                user_id: 1,  // Replace with actual user ID
                like: !liked  // Toggle like status
            });

            if (response.data.message === (liked ? "Song unliked successfully!" : "Song liked successfully!")) {
                setLikes(prevLikes => liked ? prevLikes - 1 : prevLikes + 1);
                setLiked(!liked);
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Error liking/unliking the song", error);
        }
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
                        {/* Like/Unlike button */}
            <button 
                className={`heart-button ${liked ? 'liked' : ''}`} 
                onClick={handleLike}
                aria-label={liked ? "Unlike" : "Like"}
            >
                {liked ? '♥' : '♡'} {likes}
            </button>
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
