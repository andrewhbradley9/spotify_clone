import{BrowserRouter, Routes, Route} from "react-router-dom";
import Artist from "./pages/Artist";
import Add from "./pages/Add";
import Update from "./pages/Update";
import UploadSong from "./pages/UploadSong";
import Albums from "./pages/Albums";
import Songs from "./pages/Songs";
import PlaySong from "./pages/PlaySong";

import "./style.css"
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Artist/>}/>
          <Route path="/add" element={<Add/>}/>
          <Route path="/update/:id" element={<Update/>}/>
          <Route path="/uploadSong/:id" element={<UploadSong/>}/>
          <Route path="/albums/:id" element={<Albums/>}/>
          <Route path="/albums/:albumId/songs/:artistId" element={<Songs/>} />
          <Route path="/play/:songId" element={<PlaySong />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
