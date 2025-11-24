const WebSocket = require("ws");
const url = require("url");
const { verifyToken } = require("./auth");
const broker = require("./broker");
const Pool = require("pg").Pool;

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "chat",
  password: process.env.DB_PASS || "chat123",
  database: process.env.DB_NAME || "chatdb",
});

const wss = new WebSocket.Server({
  port: process.env.PORT || 4000,
  path: "/ws",
});

// roomId -> Set of connected WebSocket clients
const rooms = new Map();

wss.on("connection", async (ws, req) => {
  const params = url.parse(req.url, true).query;
  const token = params.token;

  const user = verifyToken(token);
  if (!user) {
    ws.send(JSON.stringify({ type: "ERROR", error: "invalid token" }));
    ws.close();
    return;
  }

  ws.user = user;
  ws.subscribedRooms = new Set();

  ws.send(JSON.stringify({ type: "WELCOME", user: ws.user.username }));

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      console.error("Invalid JSON:", raw);
      return;
    }

    // ---------------- SUBSCRIBE ----------------
    if (msg.type === "SUBSCRIBE") {
      const roomId = String(msg.roomId);
      const { rows } = await pool.query("SELECT * FROM rooms WHERE id=$1", [roomId]);
      if (!rows.length) {
        ws.send(JSON.stringify({ type: "ERROR", error: "room_not_found" }));
        return;
      }

      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      const roomClients = rooms.get(roomId);

      // Evita duplicar USER_JOIN si el usuario ya está en la sala
      const alreadyInRoom = [...roomClients].some(c => c.user.id === ws.user.id);
      if (!alreadyInRoom) {
        broadcastToRoom(roomId, {
          type: "USER_JOIN",
          user: ws.user.username,
          roomId,
        });
      }

      roomClients.add(ws);
      ws.subscribedRooms.add(roomId);
      return;
    }

    // ---------------- UNSUBSCRIBE ----------------
    if (msg.type === "UNSUBSCRIBE") {
      const roomId = String(msg.roomId);
      if (rooms.has(roomId)) rooms.get(roomId).delete(ws);
      ws.subscribedRooms.delete(roomId);

      broadcastToRoom(roomId, { type: "USER_LEAVE", user: ws.user.username });
      return;
    }

    // ---------------- MESSAGE ----------------
    if (msg.type === "MESSAGE") {
      const roomId = msg.roomId;
      const { rows } = await pool.query("SELECT * FROM rooms WHERE id=$1", [roomId]);
      if (!rows.length) {
        ws.send(JSON.stringify({ type: "ERROR", error: "room_not_found" }));
        return;
      }

      const payload = {
        roomId,
        userId: ws.user.id,
        username: ws.user.username, // siempre el mismo username
        content: msg.content,
        created_at: new Date().toISOString(),
      };

      await pool.query(
        "INSERT INTO messages(room_id,user_id,content) VALUES($1,$2,$3)",
        [roomId, ws.user.id, msg.content]
      );

      broker.publish(roomId, payload);
      return;
    }
  });

  ws.on("close", () => {
    for (const roomId of ws.subscribedRooms) {
      if (rooms.has(roomId)) rooms.get(roomId).delete(ws);

      // Solo notificamos USER_LEAVE si no hay otras conexiones del mismo usuario
      const stillInRoom = [...rooms.get(roomId) || []].some(c => c.user.id === ws.user.id);
      if (!stillInRoom) {
        broadcastToRoom(roomId, { type: "USER_LEAVE", user: ws.user.username });
      }
    }
  });
});

function broadcastToRoom(roomId, message) {
  const set = rooms.get(String(roomId));
  if (!set) return;

  const str = JSON.stringify(message);
  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) client.send(str);
  }
}

// RabbitMQ broker
broker.subscribe((payload) => {
  const roomId = String(payload.roomId);
  const set = rooms.get(roomId);
  if (!set) return;

  const msg = JSON.stringify({ type: "MESSAGE", ...payload });
  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
});

console.log("✅ WebSocket server started");
