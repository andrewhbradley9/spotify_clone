import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;

const UploadAlbum = () => {
    const { id: artistId } = useParams();
    const navigate = useNavigate();
    const [albumData, setAlbumData] = useState({
        album_name: '',
        release_date: '',
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const albumId = window.location.pathname.split('/').pop();
        if (albumId !== artistId) {
            setIsUpdating(true);
            fetchAlbumData(albumId);
        }
    }, [artistId]);

    const fetchAlbumData = async (albumId) => {
        setLoading(true);
        console.log('Fetching album data for ID:', albumId); // Debug log
        try {
            const response = await axios.get(`${apiUrl}/artists/targetalbum/${albumId}`);
            console.log('Album data received:', response.data); // Debug log
            setAlbumData(response.data);
        } catch (err) {
            console.error('Error fetching album:', err);
            setError('Error fetching album data.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoHome = () => {
        navigate('/artist');
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        console.log(`Updating ${name}:`, value); // Debug log
        setAlbumData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Debugging state before submission
        console.log('Album data before submission:', albumData);

        try {
            // Ensure release_date is formatted as YYYY-MM-DD
            const formattedData = {
                ...albumData,
                release_date: new Date(albumData.release_date).toISOString().split('T')[0],
            };

            console.log('Payload being sent to backend:', formattedData);

            if (isUpdating) {
                // Update existing album
                console.log('Updating album:', albumData.album_id); // Debug log
                await axios.put(`${apiUrl}/artists/albums/${albumData.album_id}`, formattedData, {
                    headers: { 'Content-Type': 'application/json' },
                });
                alert('Album updated successfully!');
            } else {
                // Upload new album
                console.log('Uploading new album for artist ID:', artistId); // Debug log
                const response = await axios.post(`${apiUrl}/artists/artist/${artistId}/albums`, formattedData, {
                    headers: { 'Content-Type': 'application/json' },
                });
                alert('Album uploaded successfully!');

                // Extract the new album ID and redirect to the upload song page
                const newAlbumId = response.data.album_id || response.data.insertId;
                console.log('New Album ID:', newAlbumId); // Debugging
                navigate(`/uploadSong/${artistId}/${newAlbumId}`);
            }
        } catch (err) {
            console.error('Error during album submission:', err.response || err.message);
            alert(isUpdating ? 'Error updating album.' : 'Error uploading album.');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="upload-page">
            <div className="upload-header">
                <h2>{isUpdating ? 'Update Album' : 'Upload a New Album'}</h2>
                <button className="cancel" onClick={handleGoHome}>
                    Cancel
                </button>
            </div>
            <form onSubmit={handleSubmit} className="upload-form">
                <input
                    type="text"
                    name="album_name"
                    placeholder="Album Name"
                    value={albumData.album_name}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="date"
                    name="release_date"
                    value={albumData.release_date}
                    onChange={handleInputChange}
                    required
                />
                <button type="submit" className="upalbum">
                    {isUpdating ? 'Update Album' : 'Upload Album'}
                </button>
            </form>
        </div>
    );
};

export default UploadAlbum;