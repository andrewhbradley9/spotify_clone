import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

const Update = () => {
    const [artist, setArtist] = useState({
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
    const location = useLocation();
    const artistId = location.pathname.split("/")[2];
    const handleGoHome = () => {
        navigate('/');
    };
    // Fetch the current artist data to pre-fill the form
    useEffect(() => {
        const fetchArtistData = async () => {
            try {
                const res = await axios.get(`${apiUrl}/artists/${artistId}`);
                setArtist(res.data);
            } catch (err) {
                console.log(err);
            }
        };
        fetchArtistData();
    }, [artistId]);

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
            follower_count: artist.follower_count || 0, // Keep as 0 if empty
            is_verified: artist.is_verified || 0,       // Keep as 0 if empty
        };

        try {
            await axios.put(`${apiUrl}/artists/${artistId}`, artistData);
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    };

    console.log(artist);
    return (
        <div className='form'>
            <p>Update Artist</p>
            <input type="text" placeholder='artistname' value={artist.artistname} onChange={handleChange} name="artistname" />
            <input type="text" placeholder='artist_bio' value={artist.artist_bio} onChange={handleChange} name="artist_bio" />
            <input type="text" placeholder='artist_image' value={artist.artist_image} onChange={handleChange} name="artist_image" />
            <input type="text" placeholder='artist_event' value={artist.artist_event} onChange={handleChange} name="artist_event" />
            <input type="text" placeholder='awards' value={artist.awards} onChange={handleChange} name="awards" />
            <input type="text" placeholder='genre_type' value={artist.genre_type} onChange={handleChange} name="genre_type" />
            <input type="number" placeholder='follower_count' value={artist.follower_count} onChange={handleChange} name="follower_count" />
            <input type="number" placeholder='is_verified' value={artist.is_verified} onChange={handleChange} name="is_verified" />
            <button className="formButton" onClick={handleClick}>Update</button>
            <button className="cancel" onClick={handleGoHome}>Cancel</button>
        </div>
    );
}

export default Update;
