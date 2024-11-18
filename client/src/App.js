import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Artist from "./pages/Artist";
import Add from "./pages/Add";
import Update from "./pages/Update";
import UploadSong from "./pages/UploadSong";
import Songs from "./pages/Songs";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UploadAlbum from "./pages/UploadAlbum";
import ArtistPage from "./pages/ArtistPage";
import { AudioProvider } from "./context/AudioContext";
import AudioPlayer from "./components/AudioPlayer";
import Navbar from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import ListenerReports from "./pages/ListenerReports";
import ArtistReports from "./pages/ArtistReports";

import "./style.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if the user is logged in whenever the app renders
  useEffect(() => {
    const authToken = localStorage.getItem("token");
    setIsLoggedIn(!!authToken); // Update state based on token existence
  }, []);

  // Helper function for logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false); // Update state to reflect logout
  };

  return (
    <AudioProvider>
      <div className="App">
        <BrowserRouter>
          {/* Pass `isLoggedIn` and `handleLogout` to Navbar */}
          {isLoggedIn && <Navbar onLogout={handleLogout} />}

          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/artist" element={<Artist />} />
            <Route path="/add" element={<Add />} />
            <Route path="/update/:id" element={<Update />} />
            <Route path="/uploadSong/:id" element={<UploadSong />} />
            <Route path="/uploadAlbum/:id/" element={<UploadAlbum />} />
            <Route path="/albums/:albumId/songs/:artistId" element={<Songs />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
            <Route path="/artist/:artistId" element={<ArtistPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/AdminReports" element={<AdminReports />} />
            <Route path="/ListenerReports" element={<ListenerReports />} />
            <Route path="/ArtistReports" element={<ArtistReports />} />
          </Routes>

          {/* Render AudioPlayer if logged in */}
          {isLoggedIn && <AudioPlayer />}
        </BrowserRouter>
      </div>
    </AudioProvider>
  );
}

export default App;
