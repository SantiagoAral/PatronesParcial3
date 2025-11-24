import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

type WSMessage =
  | { type: "USER_JOIN"; user: string; roomId: string }
  | { type: "USER_LEAVE"; user: string; roomId: string }
  | { type: "MESSAGE"; username: string; content: string; roomId: string; created_at: string }
  | { type: "SYSTEM"; content: string };

interface BackendMessage {
  username: string;
  content: string;
  created_at: string;
}

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [log, setLog] = useState<WSMessage[]>([]);
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  // -------------------------------
  // CARGAR HISTORIAL
  // -------------------------------
  useEffect(() => {
    if (!token || !id) return;

    const loadHistory = async () => {
      try {
        const { data } = await axios.get<BackendMessage[]>(
          `http://localhost:5000/rooms/${id}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const history: WSMessage[] = data.map((m) => ({
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

    loadHistory();
  }, [id, token]);

  // -------------------------------
  // CONFIGURAR WEBSOCKET
  // -------------------------------
  useEffect(() => {
    if (!token || !id) return;

    const socket = new WebSocket(`ws://localhost:4000/ws?token=${token}`);

    socket.onopen = () => {
      console.log("WS CONNECTED");
      setWs(socket);

      socket.send(
        JSON.stringify({
          type: "SUBSCRIBE",
          roomId: id,
          username,
        })
      );

      setLog((prev) => [
        ...prev,
        { type: "SYSTEM", content: "Te has conectado al chat." },
      ]);
    };

    socket.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);

        if (data.type === "USER_JOIN" || data.type === "USER_LEAVE") {
          setLog((prev) => [...prev, data]);
          return;
        }

        if (data.type === "MESSAGE") {
          setLog((prev) => [...prev, data]);
        }
      } catch {
        console.error("WS JSON ERROR:", event.data);
      }
    };

    socket.onerror = () => console.error("WebSocket ERROR");
    socket.onclose = () => console.warn("WS CLOSED");

    return () => socket.close();
  }, [id, token]);

  // -------------------------------
  // ENVIAR MENSAJE
  // -------------------------------
  function send() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!msg.trim()) return;

    ws.send(
      JSON.stringify({
        type: "MESSAGE",
        roomId: id,
        content: msg,
        username,
      })
    );

    setMsg("");
  }

  // -------------------------------
  // SALIR DEL CHAT
  // -------------------------------
  function exitChat() {
    if (ws) ws.close();
    navigate("/rooms");
  }

  return (
    <div className="p-6 bg-gray-900 text-white h-screen flex flex-col">

      {/* Header con botón salir */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl">Chat</h1>

        <button
          onClick={exitChat}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Salir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded">
        {log.map((item, i) => {
          if (item.type === "SYSTEM") {
            return (
              <div key={i} className="text-gray-400 italic mb-2">
                {item.content}
              </div>
            );
          }

          if (item.type === "USER_JOIN") {
            return (
              <div key={i} className="text-green-400 mb-1">
                ➕ {item.user} entró a la sala
              </div>
            );
          }

          if (item.type === "USER_LEAVE") {
            return (
              <div key={i} className="text-red-400 mb-1">
                ➖ {item.user} salió de la sala
              </div>
            );
          }

          return (
            <div key={i} className="mb-2 border-b border-gray-700 pb-1">
              <b>{item.username}:</b> {item.content}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex">
        <input
          className="flex-1 bg-gray-700 p-2 rounded mr-2"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />

        <button
          onClick={send}
          className="bg-blue-500 p-2 rounded w-32 disabled:bg-gray-600"
          disabled={!ws}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}