import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

const Add = () => {
    const [artist, setArtist] = useState({
        artistname: "",
        artist_bio: "",
        artist_image: null,
        artist_event: "",
        awards: "",
        genre_type: "",
        follower_count: 0,
        is_verified: 0,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState(null); // To display error messages

    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/artist'); // Navigate to the main page
    };

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
        setError(null); // Reset error state

        // Validate required fields
        if (!artist.artistname || !artist.genre_type) {
            setError("Artist Name and Genre are required.");
            return;
        }

        const formData = new FormData();
        Object.keys(artist).forEach(key => {
            formData.append(key, artist[key]);
        });

        try {
            console.log("Submitting FormData:", artist);
            await axios.post(`${apiUrl}/artists`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate("/artist");
        } catch (err) {
            console.error("Error submitting form:", err);
            setError(err.response?.data?.message || "Failed to add artist. Please try again.");
        }
    };

    return (
        <div className="form">
            <div className="form-container">
                <button className="cancel" onClick={handleGoHome}>Cancel</button>
                <p>Add Artist</p>
                {error && <div className="error-message">{error}</div>}
                <input
                    type="text"
                    placeholder="Artist Name"
                    onChange={handleChange}
                    name="artistname"
                />
                <input
                    type="text"
                    placeholder="Artist Bio"
                    onChange={handleChange}
                    name="artist_bio"
                />
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
                    placeholder="Artist Event"
                    onChange={handleChange}
                    name="artist_event"
                />
                <input
                    type="text"
                    placeholder="Awards"
                    onChange={handleChange}
                    name="awards"
                />
                <input
                    type="text"
                    placeholder="Genre"
                    onChange={handleChange}
                    name="genre_type"
                />
                <input
                    type="number"
                    placeholder="Follower Count"
                    onChange={handleChange}
                    name="follower_count"
                />
                <input
                    type="number"
                    placeholder="Verified (0 or 1)"
                    onChange={handleChange}
                    name="is_verified"
                />
                <button className="formButton" onClick={handleClick}>Add</button>
            </div>
        </div>
    );
}

export default Add;
