class SendMessage {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    async execute({ userId, roomId, content }) {
        return await this.messageRepository.save({ userId, roomId, content });
    }
}

module.exports = SendMessage;
