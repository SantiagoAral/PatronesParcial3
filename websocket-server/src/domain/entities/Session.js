class Session {
    constructor(ws, user) {
        this.ws = ws;
        this.user = user;
        this.subscribedRooms = new Set();
    }

    send(message) {
        if (this.ws.readyState === 1) { // WebSocket.OPEN
            this.ws.send(JSON.stringify(message));
        }
    }

    subscribe(roomId) {
        this.subscribedRooms.add(String(roomId));
    }

    unsubscribe(roomId) {
        this.subscribedRooms.delete(String(roomId));
    }
}

module.exports = Session;
