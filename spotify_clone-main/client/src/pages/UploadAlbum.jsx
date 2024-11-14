import React, { useState, useEffect } from 'react'; //change
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;

const UploadAlbum = () => {
    const { id: artistId } = useParams();
    const navigate = useNavigate();
    const [albumData, setAlbumData] = useState({
        album_id: '',
        album_name: '',
        release_date: '',
        album_image: null //change
    });
    //change begin
    const [imagePreview, setImagePreview] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // If we have an albumId in the URL, we're updating
        const albumId = window.location.pathname.split('/').pop();
        if (albumId !== artistId) {
            setIsUpdating(true);
            fetchAlbumData(albumId);
        }
    }, [artistId]);

    const fetchAlbumData = async (albumId) => {
        try {
            const response = await axios.get(`${apiUrl}/artists/targetalbum/${albumId}`);
            setAlbumData(response.data);
            if (response.data.album_image) {
                setImagePreview(`${apiUrl}${response.data.album_image}`);
            }
        } catch (err) {
            console.error('Error fetching album:', err);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAlbumData(prev => ({ ...prev, album_image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };
    //change end

    const handleGoHome = () => {
        navigate('/artist');
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
        const formData = new FormData();
        
        Object.keys(albumData).forEach(key => {
            if (key === 'album_image' && typeof albumData[key] === 'string') return;
            formData.append(key, albumData[key]);
        });

        try {
            if (isUpdating) {
                await axios.put(`${apiUrl}/artists/albums/${albumData.album_id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Album updated successfully!');
            } else {
                await axios.post(`${apiUrl}/artists/artist/${artistId}/albums`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Album uploaded successfully!'); //whole try is a change
            }
            navigate(`/artist/${artistId}`);
        } catch (err) {
            console.error('Error:', err);
            alert(isUpdating ? 'Error updating album.' : 'Error uploading album.');//change
        }
    };

    return (
        <div className="upload-page">
            <div className="upload-header">
                <h2>{isUpdating ? 'Update Album' : 'Upload a New Album'}</h2>
                <button className="cancel" onClick={handleGoHome}>Cancel</button>
            </div>
            <form onSubmit={handleSubmit} className="upload-form">
                <div className="image-upload">
                    {imagePreview && (
                        <img 
                            src={imagePreview} 
                            alt="Album Preview" 
                            className="image-preview"
                        />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        name="album_image"
                    />
                </div>
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


