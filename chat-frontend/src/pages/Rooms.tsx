import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type Room = {
  id: string;
  name: string;
  is_private?: boolean;
};

// Util: obtener mensaje de error seguro
function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object" && "message" in data) {
      return (data as { message: string }).message;
    }
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido";
}

export default function Rooms() {
  const nav = useNavigate();
  const [token] = useState(() => localStorage.getItem("token"));

  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [roomType, setRoomType] = useState<"public" | "private">("private");

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [joinPass, setJoinPass] = useState("");

  // ------------------------------
  // LOGOUT / SALIR
  // ------------------------------
  function logout() {
    localStorage.removeItem("token");
    nav("/"); // → AuthChoice
  }

  // -------------------------------------------------------------
  // Cargar salas
  // -------------------------------------------------------------
  const fetchRooms = useCallback(async (): Promise<void> => {
    if (!token) return;
    try {
      const res = await axios.get<{ rooms: Room[] }>(
        "http://localhost:5000/rooms/list",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRooms(res.data.rooms ?? []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    }
  }, [token]);

  useEffect(() => {
    // Evita la advertencia de setState dentro de useEffect
    Promise.resolve().then(fetchRooms);
  }, [fetchRooms]);

  // -------------------------------------------------------------
  // Crear sala
  // -------------------------------------------------------------
  async function createRoom(): Promise<void> {
    if (!token) return;

    try {
      const payload =
        roomType === "private"
          ? { name, password: pass, is_private: true }
          : { name, is_private: false };

      const res = await axios.post(
        "http://localhost:5000/rooms/create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const roomId = res.data.id;

      // 🔥 ENTRAR AUTOMÁTICAMENTE A AMBOS TIPOS DE SALAS 🔥

      if (roomType === "private") {
        await axios.post(
          `http://localhost:5000/rooms/${roomId}/join`,
          { password: pass },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `http://localhost:5000/rooms/${roomId}/join`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      return nav("/room/" + roomId);

    } catch (err) {
      alert("No se pudo crear: " + getErrorMessage(err));
    }
  }

  // -------------------------------------------------------------
  // Unirse a sala
  // -------------------------------------------------------------
  async function joinRoom(room: Room, password: string = ""): Promise<void> {
    if (!token) return;

    try {
      const payload = room.is_private ? { password } : {};

      await axios.post(
        `http://localhost:5000/rooms/${room.id}/join`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      nav("/room/" + room.id);
    } catch (err) {
      alert("No se pudo unir: " + getErrorMessage(err));
    }
  }

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div className="p-6 text-white bg-gray-900 h-screen flex gap-10 relative">

      {/* Botón de salir */}
      <button
        onClick={logout}
        className="bg-red-600 px-4 py-2 rounded absolute top-4 right-4"
      >
        Salir
      </button>

      {/* Creador de salas */}
      <div>
        <h1 className="text-xl mb-4">Crear Sala</h1>

        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value as "public" | "private")}
          className="p-2 mb-3 bg-gray-700 rounded w-80"
        >
          <option value="public">Pública</option>
          <option value="private">Privada</option>
        </select>

        <input
          placeholder="Nombre sala"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 mb-3 bg-gray-700 rounded w-80"
        />

        {roomType === "private" && (
          <input
            placeholder="Contraseña"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="p-2 mb-3 bg-gray-700 rounded w-80"
          />
        )}

        <button
          onClick={createRoom}
          className="bg-green-600 p-2 rounded w-80"
        >
          Crear sala
        </button>
      </div>

      {/* Salas existentes */}
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
                <div>
                  {room.name}{" "}
                  <span className="text-gray-400">
                    {room.is_private ? "(Privada)" : "(Pública)"}
                  </span>
                </div>

                <button
                  className="bg-blue-600 p-1 rounded text-sm"
                  onClick={() => {
                    if (!room.is_private) {
                      return joinRoom(room, "");
                    }
                    setJoinPass("");
                    setSelectedRoom(room);
                  }}
                >
                  Entrar
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal para privadas */}
        {selectedRoom && (
          <div className="mt-4 p-4 bg-gray-800 rounded w-80">
            <h2 className="text-lg mb-2">
              Contraseña para {selectedRoom.name}
            </h2>

            <input
              type="password"
              placeholder="Contraseña"
              value={joinPass}
              onChange={(e) => setJoinPass(e.target.value)}
              className="p-2 mb-3 bg-gray-700 rounded w-full"
            />

            <button
              className="bg-blue-600 p-2 rounded w-full"
              onClick={() => {
                joinRoom(selectedRoom, joinPass);
                setSelectedRoom(null);
              }}
            >
              Entrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}













