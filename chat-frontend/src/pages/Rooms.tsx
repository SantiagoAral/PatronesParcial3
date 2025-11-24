import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

type Room = {
  id: string;
  name: string;
};

export default function Rooms() {
  const nav = useNavigate();
  const [token] = useState(() => localStorage.getItem("token"));

  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [joinPass, setJoinPass] = useState("");

  // -------------------------------------------------------------
  // Función para cargar salas
  // -------------------------------------------------------------
  async function fetchRooms(token: string) {
    try {
      const res = await axios.get("http://localhost:5000/rooms/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Verifica si la respuesta es un array, si no lo es usa []
      if (Array.isArray(res.data)) {
        setRooms(res.data);
      } else if (Array.isArray(res.data.rooms)) {
        setRooms(res.data.rooms);
      } else {
        setRooms([]);
      }

      console.log("Salas cargadas:", res.data); // para depuración
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error(error.response?.data || error.message);

      if (error.response?.status === 401) nav("/login");
      setRooms([]);
    }
  }

  // -------------------------------------------------------------
  // useEffect para cargar salas al montar el componente
  // -------------------------------------------------------------
  useEffect(() => {
    if (!token) {
      nav("/login");
      return;
    }

    (async () => {
      await fetchRooms(token);
    })();
  }, [token, nav]);

  // -------------------------------------------------------------
  // Crear sala
  // -------------------------------------------------------------
  async function createRoom() {
    if (!token) return;

    try {
      const res = await axios.post(
        "http://localhost:5000/rooms",
        { name, password: pass },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Sala creada con ID: " + res.data.id);
      await fetchRooms(token);
    } catch (err: unknown) {
      const error = err as AxiosError;
      alert("No se pudo crear la sala: " + (error.response?.data || error.message));
    }
  }

  // -------------------------------------------------------------
  // Unirse a sala
  // -------------------------------------------------------------
  async function joinRoom(room: Room) {
    if (!token) return;

    try {
      await axios.post(
        `http://localhost:5000/rooms/${room.id}/join`,
        { password: joinPass },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      nav("/room/" + room.id);
    } catch (err: unknown) {
      const error = err as AxiosError;
      alert("No se pudo unir a la sala: " + (error.response?.data || error.message));
    }
  }

  return (
    <div className="p-6 text-white bg-gray-900 h-screen flex gap-10">
      {/* Crear sala */}
      <div>
        <h1 className="text-xl mb-4">Crear Sala</h1>
        <input
          placeholder="Nombre sala"
          className="p-2 mb-3 bg-gray-700 rounded w-80"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Contraseña sala"
          type="password"
          className="p-2 mb-3 bg-gray-700 rounded w-80"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <button
          onClick={createRoom}
          className="bg-green-600 p-2 rounded w-80"
        >
          Crear sala
        </button>
      </div>

      {/* Lista de salas */}
      <div>
        <h1 className="text-xl mb-4">Salas Disponibles</h1>
        <div className="bg-gray-800 p-4 rounded w-80 max-h-96 overflow-y-auto">
          {rooms.length === 0 ? (
            <div>No hay salas disponibles</div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className="flex justify-between items-center mb-2 bg-gray-700 hover:bg-gray-600 p-2 rounded"
              >
                <div>{room.name} <span className="text-gray-400">({room.id})</span></div>
                <button
                  className="bg-blue-600 p-1 rounded text-sm"
                  onClick={() => setSelectedRoom(room)}
                >
                  Entrar
                </button>
              </div>
            ))
          )}
        </div>

        {/* Contraseña para unirse */}
        {selectedRoom && (
          <div className="mt-4 p-4 bg-gray-800 rounded w-80">
            <h2 className="text-lg mb-2">Contraseña para {selectedRoom.name}</h2>
            <input
              type="password"
              placeholder="Contraseña"
              className="p-2 mb-3 bg-gray-700 rounded w-full"
              value={joinPass}
              onChange={(e) => setJoinPass(e.target.value)}
            />
            <button
              className="bg-blue-600 p-2 rounded w-full"
              onClick={() => joinRoom(selectedRoom)}
            >
              Entrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



