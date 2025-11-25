class MessageRepository {
    async save({ userId, roomId, content }) {
        throw new Error('Method not implemented');
    }

    async findRoomById(roomId) {
        throw new Error('Method not implemented');
    }
}

module.exports = MessageRepository;
