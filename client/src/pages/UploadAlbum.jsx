import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;

const UploadAlbum = () => {
    const { id: artistId } = useParams(); // Get artistId from the URL
    const navigate = useNavigate();

    const [albumData, setAlbumData] = useState({
        album_id: '',       // Manually set album ID
        album_name: '',
        release_date: ''
    });

    const handleGoHome = () => {
        navigate('/');
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setAlbumData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            console.log(`Posting to ${apiUrl}/artists/artist/${artistId}/albums`, albumData); // Confirm the URL and data
            await axios.post(`${apiUrl}/artists/artist/${artistId}/albums`, albumData);
            alert('Album uploaded successfully!');
            navigate('/');
        } catch (err) {
            console.error('Error uploading album:', err.response?.data || err.message);
            alert('Error uploading album.');
        }
    };

    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Cancel</button>
            <h2>Upload a New Album for Artist</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="album_name"
                    placeholder="Album Name"
                    className='uppies2'
                    value={albumData.album_name}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="date"
                    name="release_date"
                    className='uppies2'
                    value={albumData.release_date}
                    onChange={handleInputChange}
                    required
                />
                <button type="submit" className='upalbum'>Upload Album</button>
            </form>
        </div>
    );
};

export default UploadAlbum;


