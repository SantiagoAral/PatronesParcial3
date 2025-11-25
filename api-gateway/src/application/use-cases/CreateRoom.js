const Room = require('../../domain/entities/Room');

class CreateRoom {
    constructor(roomRepository) {
        this.roomRepository = roomRepository;
    }

    async execute({ name, is_private, password_hash }) {
        const room = new Room({ name, is_private, password_hash });
        return await this.roomRepository.create(room);
    }
}

module.exports = CreateRoom;
