class HandleSubscription {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    async execute(session, roomId, broadcastCallback) {
        const room = await this.messageRepository.findRoomById(roomId);
        if (!room) {
            session.send({ type: "ERROR", error: "room_not_found" });
            return;
        }

        // Logic to add session to room tracking is handled by the WebSocketServer/Handler
        // But here we can validate and notify
        session.subscribe(roomId);

        // Broadcast USER_JOIN
        broadcastCallback(roomId, {
            type: "USER_JOIN",
            user: session.user.username,
            roomId,
        });
    }
}

module.exports = HandleSubscription;
