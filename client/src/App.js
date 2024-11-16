import { BrowserRouter, Routes, Route } from "react-router-dom";
import Artist from "./pages/Artist";
import Add from "./pages/Add";
import Update from "./pages/Update";
import UploadSong from "./pages/UploadSong";
import Songs from "./pages/Songs";
// import PlaySong from "./pages/PlaySong";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UploadAlbum from "./pages/UploadAlbum";
import ArtistPage from "./pages/ArtistPage";
import { AudioProvider } from "./context/AudioContext";
import AudioPlayer from "./components/AudioPlayer";
import Navbar from "./components/Navbar";

import "./style.css";

function App() {
  const location = window.location.pathname;
  const isAuthPage = location === "/" || location === "/login" || location === "/register";

  return (
    <AudioProvider>
      <div className="App">
        <BrowserRouter>
          {/* Show Navbar only on non-authentication pages */}
          {!isAuthPage && <Navbar />}

          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/artist" element={<Artist />} />
            <Route path="/add" element={<Add />} />
            <Route path="/update/:id" element={<Update />} />
            <Route path="/uploadSong/:id" element={<UploadSong />} />
            <Route path="/uploadAlbum/:id/" element={<UploadAlbum />} />
            <Route path="/albums/:albumId/songs/:artistId" element={<Songs />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/artist/:artistId" element={<ArtistPage />} />
          </Routes>

          {/* Show AudioPlayer on all pages except login and register */}
          {!isAuthPage && <AudioPlayer />}
        </BrowserRouter>
      </div>
    </AudioProvider>
  );
}

export default App;
