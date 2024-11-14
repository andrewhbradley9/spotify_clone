import { BrowserRouter, Routes, Route } from "react-router-dom";
import Artist from "./pages/Artist";
import Add from "./pages/Add";
import Update from "./pages/Update";
import UploadSong from "./pages/UploadSong";
import Albums from "./pages/Albums";
import Songs from "./pages/Songs";
import PlaySong from "./pages/PlaySong";
import SearchArtist from "./pages/SearchArtist";
import SearchSong from "./pages/SearchSong";
import Register from './pages/Register';
import Login from './pages/Login';
import UploadAlbum from "./pages/UploadAlbum";
import Regi from './pages/Regi'; // <-- Import Regi component here

import "./style.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/artist" element={<Artist />} />
          <Route path="/add" element={<Add />} />
          <Route path="/update/:id" element={<Update />} />
          <Route path="/uploadSong/:id" element={<UploadSong />} />
          <Route path="/albums/:id" element={<Albums />} />
          <Route path="/uploadAlbum/:id" element={<UploadAlbum />} />
          <Route path="/albums/:albumId/songs/:artistId" element={<Songs />} />
          <Route path="/play/:albumId/:songId" element={<PlaySong />} />
          <Route path="/search/artist" element={<SearchArtist />} />
          <Route path="/search/song" element={<SearchSong />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/regi" element={<Regi />} /> {/* <-- Use Regi component here */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
