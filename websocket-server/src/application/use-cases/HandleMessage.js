class HandleMessage {
    constructor(messageRepository, broker) {
        this.messageRepository = messageRepository;
        this.broker = broker;
    }

    async execute(session, roomId, content) {
        const room = await this.messageRepository.findRoomById(roomId);
        if (!room) {
            session.send({ type: "ERROR", error: "room_not_found" });
            return;
        }

        const payload = {
            roomId,
            userId: session.user.id,
            username: session.user.username,
            content,
            created_at: new Date().toISOString(),
        };

        await this.messageRepository.save({
            userId: session.user.id,
            roomId,
            content
        });

        this.broker.publish(roomId, payload);
    }
}

module.exports = HandleMessage;
