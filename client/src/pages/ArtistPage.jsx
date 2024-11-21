import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

const ArtistPage = () => {
    const { artistId } = useParams();
    const navigate = useNavigate();
    const [artist, setArtist] = useState(null);
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);

    // Get the logged-in user's details
    const loggedInUserId = localStorage.getItem('userId');
    const loggedInArtistId = localStorage.getItem('artistId'); 
    const loggedInRole = localStorage.getItem('role'); 
    const authToken = localStorage.getItem('token');
    const isAuthorized = loggedInRole === 'admin' || loggedInArtistId === artistId; 

    console.log("authToken:", authToken);

    useEffect(() => {
        const fetchArtistDetails = async () => {
            setLoading(true);
            try {
                // Use the new endpoint
                const response = await axios.get(`${apiUrl}/artists/artist/${artistId}/details`, {
                    params: {
                        limit: 10, // Adjust the limit based on your pagination setup
                        offset: 0, // Start at the first page
                    },
                    headers: { Authorization: `Bearer ${authToken}` },
                });
    
                // The response will include paginated artist details, albums, and songs
                const { artist, albums } = response.data;
    
                setArtist(artist); // Set artist details
                setAlbums(albums); // Include albums and their songs
            } catch (err) {
                console.error('Error fetching artist details:', err);
                setError('Error fetching artist details');
            } finally {
                setLoading(false);
            }
        };
    
        fetchArtistDetails();
    }, [artistId, authToken]);
    

    console.log("artistId and userId", loggedInUserId, artistId);

    useEffect(() => {
        const fetchFollowStatus = async () => {
            if (!authToken) {
                console.error('Token is missing. Skipping follow status fetch.');
                return;
            }

            try {
                const { data: followStatus } = await axios.get(
                    `${apiUrl}/follow/user/${loggedInUserId}/follow-status/${artistId}`,
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );
                setIsFollowing(followStatus.status === 'following');
            } catch (err) {
                console.error('Error fetching follow status:', err);
                setError('Error fetching follow status');
            }
        };

        if (loggedInUserId) fetchFollowStatus();
    }, [artistId, loggedInUserId, authToken]);

    const handleFollowToggle = async () => {
        if (!authToken) {
            console.error('Token is missing. Cannot follow or unfollow.');
            return;
        }
        if (loggedInArtistId === artistId) {
            alert("You can't follow yourself!");
            return;
        }

        try {
            if (isFollowing) {
                // Unfollow the artist
                await axios.post(
                    `${apiUrl}/follow/user/${loggedInUserId}/unfollow/${artistId}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );
                setIsFollowing(false);
            } else {
                // Follow the artist
                await axios.post(
                    `${apiUrl}/follow/user/${loggedInUserId}/follower/${artistId}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );
                setIsFollowing(true);
            }
        } catch (err) {
            console.error('Error toggling follow status:', err);
            alert('Failed to update follow status. Please try again.');
        }
    };
    const handleGoHome = () => {
        navigate('/artist');
    };
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };
    const handleDeleteAlbum = async (albumId,albumName) => {
        try {
            const isConfirmed = window.confirm(
                'Are you sure you want to delete this album? This action cannot be undone.'
            );

            if (isConfirmed) {
                await axios.delete(`${apiUrl}/artists/albums/${albumId}'`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                alert(`Album "${albumName}" deleted successfully.`);
                navigate(`/artist/${artistId}`);
            }
        } catch (err) {
            console.error('Error deleting album:', err);
            alert('Error deleting album. Please try again.');
        }
    };
    const handleDelete = async () => {
        try {
            const isConfirmed = window.confirm(
                'Are you sure you want to delete this account? This action cannot be undone.'
            );
    
            if (isConfirmed) {    
                alert('Successfully Deleted Account');
    
                // If the user is an artist and is deleting their own account
                if (loggedInRole === 'artist' && loggedInArtistId === artistId) {
                    alert('Bye! It was nice listening to your music!');
                    localStorage.clear(); // Clear all localStorage
                    navigate('/login'); // Redirect to login
                } else {
                    alert(`Deleted artist: ${artist.artistname}`);
                    navigate('/artist'); // Redirect to artist page
                }
            }
        } catch (err) {
            console.error('Error deleting account:', err);
            alert('Error deleting account. Please try again.');
        }
    };
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!artist) return <div>Artist not found</div>;

    return (
        <div className="artist-page">
            <div className="artist-header">
                <div className="artist-profile">
                    {artist?.artist_image ? (
                        <img
                            src={`${apiUrl}${artist.artist_image}`}
                            alt={artist.artistname}
                            className="artist-profile-image"
                        />
                    ) : (
                        <div className="artist-placeholder">
                            <span>{artist?.artistname?.[0]}</span>
                        </div>
                    )}
                    <h1>{artist?.artistname}</h1>
                    {artist?.is_verified && <span className="verified-badge">✓ Verified Artist</span>}
                </div>

                <div className="artist-info">
                    <p className="genre">{artist.genre_type}</p>
                    <p className="bio">{artist.artist_bio}</p>
                    <p className="stats">
                        <span>Followers: {artist.follower_count || 0}</span>
                        {artist.awards && <span>Awards: {artist.awards}</span>}
                    </p>
                </div>

                {loggedInArtistId !== artistId && (
                    <button
                        className={`follow-button ${isFollowing ? 'following' : 'follow'}`}
                        onClick={handleFollowToggle}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                )}

            </div>

            <div className="albums-section">
                <h2>Albums</h2>
                <div className="albums-grid">
                    {albums.map((album) => (
                        <div key={album.album_id} className="album-card">
                            <Link to={`/albums/${album.album_id}/songs/${artistId}`}>
                                {album.album_image ? (
                                    <img
                                        src={`${apiUrl}${album.album_image}`}
                                        alt={album.album_name}
                                        className="album-image"
                                    />
                                ) : (
                                    <div className="album-placeholder">
                                        <span>{album.album_name[0]}</span>
                                        
                                    </div>
                                )}
                                {(loggedInRole === 'admin' || (loggedInRole === 'artist' && String(artistId) === loggedInArtistId)) && (
                                <button
                                    className="delete-album-button"
                                    onClick={() => handleDeleteAlbum(album.album_id,album.album_name)}
                                    title="Delete Album"
                                >
                                    🗑️
                                </button>
                                )}
                                <div className="album-info">
                                    <h3>{album.album_name}</h3>
                                    <p>{formatDate(album.release_date)}</p>
                                    <p>{album.songs?.length || 0} songs</p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            <div className="action-buttons">
                {isAuthorized && (
                    <>
                        <button className="upload">
                            <Link to={`/uploadSong/${artist.artist_id}`}>Upload Song</Link>
                        </button>
                        <button className="uppies">
                            <Link to={`/uploadAlbum/${artist.artist_id}`}>Upload Album</Link>
                        </button>
                        <button className="update">
                            <Link to={`/update/${artist.artist_id}`}>Update Artist</Link>
                        </button>
                        <button className="delete" onClick={handleDelete}>
                            Delete Artist
                        </button>
                    </>
                )}
            </div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
        </div>
    );
};

export default ArtistPage;
