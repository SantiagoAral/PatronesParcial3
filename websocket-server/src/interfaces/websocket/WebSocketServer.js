const WebSocket = require("ws");
const url = require("url");
const { verifyToken } = require("../../infrastructure/auth/auth");

class WebSocketServer {
    constructor(server, chatHandler, broker) {
        this.wss = new WebSocket.Server({ server, path: "/ws" });
        this.chatHandler = chatHandler;
        this.broker = broker;
        this.rooms = new Map(); // roomId -> Set<Session>

        this.init();
    }

    init() {
        this.wss.on("connection", async (ws, req) => {
            const params = url.parse(req.url, true).query;
            const token = params.token;

            const user = verifyToken(token);
            if (!user) {
                ws.send(JSON.stringify({ type: "ERROR", error: "invalid token" }));
                ws.close();
                return;
            }

            const session = await this.chatHandler.handleConnection(ws, user, (roomId, message) => {
                this.broadcastToRoom(roomId, message);
            });

            // We need to track sessions per room for broadcasting
            // The session object tracks its own subscriptions, but for broadcasting we need a reverse lookup
            // or we iterate all sessions.
            // The original code used `rooms` map.
            // Let's hook into the subscribe/unsubscribe logic? 
            // The `chatHandler` calls `broadcastCallback` on join/leave.
            // But we also need to maintain the `rooms` map for the actual broadcasting.

            // Ideally, the `Session` entity or a `SessionManager` should handle this.
            // For now, let's keep it simple and hacky:
            // We can't easily sync `rooms` map from inside `chatHandler` without exposing it.
            // Let's pass a "RoomManager" to `ChatHandler`?
            // Or let `ChatHandler` return events that we act upon?

            // Let's make `broadcastToRoom` iterate all clients and check if they are subscribed.
            // This is less efficient but cleaner for now.
            // Or we can attach the `rooms` map to the `broadcastCallback` context?

            // Actually, let's just use the `rooms` map in `WebSocketServer` and update it when we receive specific messages?
            // No, that leaks logic.

            // Let's stick to: "Iterate all clients".
            // `this.wss.clients` gives us all connected clients.
            // Each client (ws) can have the `session` attached.
            ws.session = session;
        });

        // Subscribe to Broker
        this.broker.subscribe((payload) => {
            this.broadcastToRoom(String(payload.roomId), { type: "MESSAGE", ...payload });
        });
    }

    broadcastToRoom(roomId, message) {
        const str = JSON.stringify(message);
        for (const client of this.wss.clients) {
            if (client.readyState === WebSocket.OPEN && client.session && client.session.subscribedRooms.has(roomId)) {
                client.send(str);
            }
        }
    }
}

module.exports = WebSocketServer;
