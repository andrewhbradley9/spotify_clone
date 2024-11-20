import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link,useLocation, useNavigate,  } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;

const UploadSong = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve logged-in artist's ID and role
    const loggedInArtistId = localStorage.getItem('artistId');
    const loggedInRole = localStorage.getItem('role');

    console.log('Logged-in Artist ID:', loggedInArtistId); // Debugging
    console.log('Logged-in Role:', loggedInRole); // Debugging

    // Get the artistId from the URL
    const artistIdFromUrl = location.pathname.split('/')[2];
    console.log('Artist ID from URL:', artistIdFromUrl); // Debugging

    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [genres, setGenres] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState('');
    const [songData, setSongData] = useState({
        title: '',
        songimage: '',
        duration: '',
        song_releasedate: '',
        genre_type: '',
        song_language: '',
        mp3_data: null, // Initialize mp3_data as null
    });

    const handleGoHome = () => {
        navigate('/artist');
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
    // Fetch albums when the component mounts
    useEffect(() => {
        if (loggedInRole !== 'admin' && loggedInArtistId !== artistIdFromUrl) {
            setError('You are not authorized to upload songs for this artist.');
            setLoading(false);
            return;
        }

        const fetchAlbums = async () => {
            try {
                const response = await axios.get(`${apiUrl}/artists/albums/${artistIdFromUrl}`);
                console.log('Fetched albums:', response.data); // Debugging
                setAlbums(response.data);
            } catch (err) {
                console.error('Error fetching albums:', err);
                setError('Error fetching albums. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchAlbums();
    }, [artistIdFromUrl, loggedInArtistId, loggedInRole]);

    const handleAlbumChange = (event) => {
        setSelectedAlbumId(event.target.value);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSongData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleFileChange = (event) => {
        setSongData((prevState) => ({
            ...prevState,
            mp3_data: event.target.files[0], // Set the mp3_data to the selected file
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        Object.keys(songData).forEach((key) => {
            formData.append(key, songData[key]);
        });
        formData.append('album_id', selectedAlbumId); // Include album_id in the payload

        // Debugging FormData
        console.log('FormData being sent to backend:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            const response = await axios.post(
                `${apiUrl}/song/albums/${selectedAlbumId}/songs/${artistIdFromUrl}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data', // Set the content type for file upload
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            console.log('Song uploaded successfully:', response.data); // Debugging
            alert('Song uploaded successfully!');
            navigate(`/artist/${artistIdFromUrl}`); // Navigate back to the main screen
        } catch (err) {
            console.error('Error uploading song:', err.response || err.message);
            alert('Error uploading song. Please check your input and try again.');
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
                <button className="cancel" onClick={handleGoHome}>
                    Cancel
                </button>
            </div>

            {albums.length > 0 ? (
                <form onSubmit={handleSubmit} className="upload-form">
                    <select value={selectedAlbumId} onChange={handleAlbumChange} required>
                        <option value="" disabled>
                            Select an album
                        </option>
                        {albums.map((album) => (
                            <option key={album.album_id} value={album.album_id}>
                                {album.album_name} ({new Date(album.release_date).toLocaleDateString('en-US')})
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
                            <select
                                value={songData.genre_type}
                                onChange={handleInputChange}
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
                            <button type="submit" className="upsong">
                                Upload Song
                            </button>
                        </>
                    )}
                </form>
            ) : (
                <div>
                <p>No albums found. Please create an album first.</p>
                <button className="upload">
                            <Link to={`/artist/${loggedInArtistId}`}>back to artist page</Link>
                        </button>
                </div>
            )}
        </div>
    );
};

export default UploadSong;
