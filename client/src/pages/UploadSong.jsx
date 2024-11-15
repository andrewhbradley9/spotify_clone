import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;
const UploadSong = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const artistId = location.pathname.split("/")[2];
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAlbumId, setSelectedAlbumId] = useState("");
    const [songData, setSongData] = useState({
        title: '',
        songimage: '',
        duration: '',
        song_releasedate: '',
        genre_type: '',
        song_language: '',
        file_path: '',
        mp3_data: null // Initialize mp3_data as null
    });

    const handleGoHome = () => {
        navigate('/artist');
    };

    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const response = await axios.get(`${apiUrl}/artists/albums/${artistId}`);
                setAlbums(response.data);
            } catch (err) {
                setError('Error fetching albums');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAlbums();
    }, [artistId]);

    const handleAlbumChange = (event) => {
        setSelectedAlbumId(event.target.value);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSongData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = (event) => {
        setSongData(prevState => ({
            ...prevState,
            mp3_data: event.target.files[0] // Set the mp3_data to the selected file
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        
        // Append all fields to the FormData
        for (const key in songData) {
            formData.append(key, songData[key]);
        }
        formData.append('album_id', selectedAlbumId); // Include album_id in the payload

        try {
            await axios.post(`${apiUrl}/artists/albums/${selectedAlbumId}/songs/${artistId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Set the content type for file upload
                },
            });
            alert('Song uploaded successfully!');
            navigate('/artist'); // Navigate back to the main screen
        } catch (err) {
            console.error('Error uploading song:', err);
            alert('Error uploading song.');
        }
    };

    if (loading) {
        return <div>Loading albums...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="upload-page">
            <div className="upload-header">
                <h2>Upload a New Song</h2>
                <button className="cancel" onClick={handleGoHome}>Cancel</button>
            </div>
            
            {albums.length > 0 ? (
                <form onSubmit={handleSubmit} className="upload-form">
                    <select value={selectedAlbumId} onChange={handleAlbumChange}>
                        <option value="" disabled>Select an album</option>
                        {albums.map(album => (
                            <option key={album.album_id} value={album.album_id}>
                                {album.album_name} ({album.release_date})
                            </option>
                        ))}
                    </select>

                    {selectedAlbumId && (
                        <>
                            <input
                                type="text"
                                name="title"
                                placeholder="Song Title"
                                value={songData.title}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="text"
                                name="songimage"
                                placeholder="Song Image URL"
                                value={songData.songimage}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="duration"
                                placeholder="Duration (e.g., 00:03:30)"
                                value={songData.duration}
                                onChange={handleInputChange}
                            />
                            <input
                                type="date"
                                name="song_releasedate"
                                value={songData.song_releasedate}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="genre_type"
                                placeholder="Genre"
                                value={songData.genre_type}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="song_language"
                                placeholder="Language"
                                value={songData.song_language}
                                onChange={handleInputChange}
                            />
                            <div className="file-input-container">
                                <input
                                    type="file"
                                    name="mp3_data"
                                    accept="audio/mpeg"
                                    onChange={handleFileChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="upsong">Upload Song</button>
                        </>
                    )}
                </form>
            ) : (
                <p>No albums found. Please create an album first.</p>
            )}
        </div>
    );
};

export default UploadSong;
