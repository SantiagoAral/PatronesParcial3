import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthChoice from "./pages/AuthChoice.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Rooms from "./pages/Rooms.tsx";
import ChatRoom from "./pages/ChatRoom.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthChoice />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ⬅ Reemplazamos create y join por Rooms */}
        <Route path="/rooms" element={<Rooms />} />

        <Route path="/room/:id" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

