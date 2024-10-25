import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Add = () => {
    const [artist, setArtist] = useState({
        artist_id: "",
        artistname: "",
        artist_bio: "",
        artist_image: "",
        artist_event: "",
        awards: "",
        genre_type: "",
        follower_count: 0,
        is_verified: 0,
    });

    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/'); // Navigate to the main page
    };
    const handleChange = (e) => {
        setArtist(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault();
        
        // Convert empty fields to null
        const artistData = {
            artist_id: artist.artist_id || null,
            artistname: artist.artistname || null,
            artist_bio: artist.artist_bio || null,
            artist_image: artist.artist_image || null,
            artist_event: artist.artist_event || null,
            awards: artist.awards || null,
            genre_type: artist.genre_type || null,
            follower_count: artist.follower_count || 0, // or use 0 if you prefer
            is_verified: artist.is_verified || 0,       // or use 0 if you prefer
        };

        try {
            await axios.post("http://localhost:3360/artists", artistData);
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    };

    console.log(artist);
    return (
        <div className='form'>
            <p>Add Artist</p>
            <input type="number" placeholder='artist_id' onChange={handleChange} name="artist_id" />
            <input type="text" placeholder='artistname' onChange={handleChange} name="artistname" />
            <input type="text" placeholder='artist_bio' onChange={handleChange} name="artist_bio" />
            <input type="text" placeholder='artist_image' onChange={handleChange} name="artist_image" />
            <input type="text" placeholder='artist_event' onChange={handleChange} name="artist_event" />
            <input type="text" placeholder='awards' onChange={handleChange} name="awards" />
            <input type="text" placeholder='genre_type' onChange={handleChange} name="genre_type" />
            <input type="number" placeholder='follower_count' onChange={handleChange} name="follower_count" />
            <input type="number" placeholder='is_verified' onChange={handleChange} name="is_verified" />
            <button className="formButton" onClick={handleClick}>Add</button>
            <button className="cancel" onClick={handleGoHome}>Cancel</button>
        </div>
    );
}

export default Add;
