class GetMessages {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    async execute(roomId) {
        return await this.messageRepository.findByRoomId(roomId);
    }
}

module.exports = GetMessages;
