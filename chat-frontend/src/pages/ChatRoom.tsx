
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// -----------------------------
// TIPOS
// -----------------------------
type WSMessage =
  | { type: "USER_JOIN"; user: string; roomId: string }
  | { type: "USER_LEAVE"; user: string; roomId: string }
  | { type: "MESSAGE"; username: string; content: string; roomId: string; created_at: string };

interface BackendMessage {
  username: string;
  content: string;
  created_at: string;
}

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [log, setLog] = useState<WSMessage[]>([]);
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username"); // nombre guardado al login

  // -------------------------------
  // CARGAR HISTORIAL DE MENSAJES
  // -------------------------------
  useEffect(() => {
    if (!token || !id) return;

    const fetchHistory = async () => {
      try {
        const res = await axios.get<BackendMessage[]>(`http://localhost:5000/rooms/${id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const history: WSMessage[] = res.data.map((m) => ({
          type: "MESSAGE",
          username: m.username,
          content: m.content,
          roomId: id,
          created_at: m.created_at,
        }));

        setLog(history);
      } catch (err) {
        console.error("Error cargando historial:", err);
      }
    };

    fetchHistory();
  }, [id, token]);

  // -------------------------------
  // CONFIGURAR WEBSOCKET
  // -------------------------------
  useEffect(() => {
    if (!token || !id) return;

    const socket = new WebSocket(`ws://localhost:4000/ws?token=${token}`);

    socket.onopen = () => {
      console.log("WS OPEN");
      setWs(socket);
      socket.send(JSON.stringify({ type: "SUBSCRIBE", roomId: id }));
    };

    socket.onmessage = (m) => {
      try {
        const data: WSMessage = JSON.parse(m.data);
        setLog((prev) => [...prev, data]);
      } catch {
        console.error("WS JSON ERROR:", m.data);
      }
    };

    socket.onerror = () => console.error("WebSocket ERROR");
    socket.onclose = () => console.log("WS CLOSED");

    return () => socket.close();
  }, [id, token]);

  // -------------------------------
  // ENVIAR MENSAJE
  // -------------------------------
  function send() {
    if (!ws || ws.readyState !== WebSocket.OPEN || !msg.trim()) return;

    ws.send(JSON.stringify({
      type: "MESSAGE",
      roomId: id,
      content: msg,
      username, // enviamos siempre el mismo username
    }));

    setMsg("");
  }

  return (
    <div className="p-6 bg-gray-900 text-white h-screen flex flex-col">
      <h1 className="text-xl mb-3">Sala {id}</h1>

      <div className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded">
        {log.map((item, i) => {
          switch (item.type) {
            case "USER_JOIN":
              return <div key={i} className="mb-2 text-green-400">➕ {item.user} entró a la sala</div>;
            case "USER_LEAVE":
              return <div key={i} className="mb-2 text-red-400">➖ {item.user} salió de la sala</div>;
            case "MESSAGE":
              return <div key={i} className="mb-2 border-b border-gray-700 pb-1"><b>{item.username}:</b> {item.content}</div>;
            default:
              return null;
          }
        })}
      </div>

      <div className="mt-4 flex">
        <input
          className="flex-1 bg-gray-700 p-2 rounded mr-2"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button
          disabled={!ws}
          onClick={send}
          className="bg-blue-500 p-2 rounded w-32 disabled:bg-gray-600"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
