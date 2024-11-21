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
    const userRole = localStorage.getItem('role');
    const [imagePreview, setImagePreview] = useState(null);
    const [genres, setGenres] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const artistId = location.pathname.split("/")[2];
    const handleGoHome = () => {
        navigate('/artist');
    };

    console.log("artistId:", artistId);

    // Fetch the current artist data to pre-fill the form
    useEffect(() => {
        const fetchArtistData = async () => {
            try {
                const res = await axios.get(`${apiUrl}/artists/${artistId}`);
                setArtist(res.data);
                if (res.data.artist_image) {
                    setImagePreview(`${apiUrl}${res.data.artist_image}`);
                }
            } catch (err) {
                console.log(err);
            }
        };
        fetchArtistData();
    }, [artistId]);

    const handleChange = (e) => {
        setArtist(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArtist(prev => ({ ...prev, artist_image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleClick = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        Object.keys(artist).forEach(key => {
            if (key === 'artist_image' && typeof artist[key] === 'string') {
                // Skip if it's the existing image URL
                return;
            }
            formData.append(key, artist[key]);
        });

        formData.forEach((value, key) => {
            console.log(`${key}:`, value);
        });

        try {
            await axios.put(`${apiUrl}/artists/${artistId}`, formData);
            navigate("/artist");
        } catch (err) {
            console.log("Error during update:",err);
        }
    };
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await axios.get(`${apiUrl}/artists/genres/types`);
                setGenres(response.data);
            } catch (err) {
                console.error("Error fetching genres:", err);
            }
        };
        fetchGenres();
    }, []);
    console.log(artist);
    return (
        <div className='form'>
            <div className="form-container">
                <button className="cancel" onClick={handleGoHome}>Cancel</button>
                <p>Update Artist</p>
                <div className="image-upload">
                    {imagePreview && (
                        <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="image-preview"
                        />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        name="artist_image"
                    />
                </div>
                <input
                    type="text"
                    placeholder='Artist Name'
                    value={artist.artistname}
                    onChange={handleChange}
                    name="artistname"
                />
                <input
                    type="text"
                    placeholder='Artist Bio'
                    value={artist.artist_bio}
                    onChange={handleChange}
                    name="artist_bio"
                />
                <input
                    type="text"
                    placeholder='Artist Event'
                    value={artist.artist_event}
                    onChange={handleChange}
                    name="artist_event"
                />
                <input
                    type="text"
                    placeholder='Awards'
                    value={artist.awards}
                    onChange={handleChange}
                    name="awards"
                />
                <select
                    value={artist.genre_type}
                    onChange={handleChange}
                    name="genre_type"
                    required
                    >
                    <option value="" disabled>Select Genre</option>
                    {genres.map((genre, index) => (
                        <option key={index} value={genre.genre_type}>
                            {genre.genre_type}
                </option>
                ))}
                </select>
                {userRole === 'admin' && (
                    <input
                        type="number"
                        placeholder='Follower Count'
                        value={artist.follower_count}
                        onChange={handleChange}
                        name="follower_count"
                    />
                )}
                <button className="formButton" onClick={handleClick}>Update</button>
            </div>
        </div>
    );
}

export default Update;
