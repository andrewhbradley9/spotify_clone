import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

const Artist = () => {
    const [artists, setArtist] = useState([]);

    useEffect(() => {
        const fetchAllArtists = async () => {
            try {
                const res = await axios.get(`${apiUrl}/artists`);
                setArtist(res.data);
            } catch (err) {
                console.log("Error fetching artists:", err);
            }
        };
        fetchAllArtists();
    }, []);

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`${apiUrl}/artists/${id}`);
            console.log("Delete response:", response.data); // Log the response
            setArtist((prev) => prev.filter((artist) => artist.artist_id !== id));
        } catch (err) {
            console.error("Error deleting artist:", err.response?.data || err.message);
            alert("Failed to delete artist.");
        }
    };
    
    
    return (
        <div>
            <h1>coog_music</h1>
            <button className="search"><Link to={`/search/artist`}>Search Artist</Link></button>
            <button className="search"><Link to={`/search/song`}>Search Song</Link></button>
            <div className="artists">
                {artists.map(artist => (
                    <div className="artist" key={artist.artist_id}>
                        {artist.artist_image ? (
                            <img src={artist.artist_image} alt={artist.artistname} />
                        ) : (
                            <p>No image available</p>
                        )}
                        <h2>Artist: <span>{artist.artistname}</span></h2>
                        <p>Bio: <span>{artist.artist_bio || "No biography available"}</span></p>
                        <p>Events: <span>{artist.artist_event || "No Events Currently"}</span></p>
                        <p>Awards: <span>{artist.awards || "none"}</span></p>
                        <p>Genre: <span>{artist.genre_type || "Unknown genre"}</span></p>
                        <p>Followers: <span>{artist.follower_count > 0 ? artist.follower_count : "No followers"}</span></p>
                        <p>{artist.is_verified ? "Verified Artist" : "Not Verified"}</p>
                        <button className="delete" onClick={() => handleDelete(artist.artist_id)}>Delete</button>
                        <button className="update"><Link to={`/update/${artist.artist_id}`}>Update</Link></button>
                        <button className="upload"><Link to={`/uploadSong/${artist.artist_id}`}>Upload a Song</Link></button>
                        <button className="album"><Link to={`/albums/${artist.artist_id}`}>Albums and Songs</Link></button>
                    </div>
                ))}
            </div>
            <p>
                <button className="add">
                    <Link to="/add">Add new Artist</Link>
                </button>
            </p>
        </div>
    );
};

export default Artist;
