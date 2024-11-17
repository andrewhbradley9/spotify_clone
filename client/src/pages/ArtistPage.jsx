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
        const fetchArtistAndAlbums = async () => {
            try {
                const [artistRes, albumsRes] = await Promise.all([
                    axios.get(`${apiUrl}/artists/${artistId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }),
                    axios.get(`${apiUrl}/artists/albums/${artistId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }),
                ]);

                setArtist(artistRes.data);

                const albumsWithSongs = await Promise.all(
                    albumsRes.data.map(async (album) => {
                        const songsRes = await axios.get(
                            `${apiUrl}/artists/albums/${album.album_id}/songs/${artistId}`,
                            {
                                headers: { Authorization: `Bearer ${authToken}` },
                            }
                        );
                        return { ...album, songs: songsRes.data };
                    })
                );
                setAlbums(albumsWithSongs);
            } catch (err) {
                setError('Error fetching artist details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchArtistAndAlbums();
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

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const handleDelete = async () => {
        try {
            const isConfirmed = window.confirm(
                'Are you sure you want to delete this artist? This action cannot be undone.'
            );

            if (isConfirmed) {
                await axios.delete(`${apiUrl}/artists/${artistId}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                navigate('/artist');
            }
        } catch (err) {
            console.error('Error deleting artist:', err);
            alert('Error deleting artist. Please try again.');
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

                <button
                    className={`follow-button ${isFollowing ? 'following' : 'follow'}`}
                    onClick={handleFollowToggle}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
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
        </div>
    );
};

export default ArtistPage;
