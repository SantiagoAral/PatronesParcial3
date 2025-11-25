const CreateRoom = require('../../../application/use-cases/CreateRoom');
const JoinRoom = require('../../../application/use-cases/JoinRoom');
const ListRooms = require('../../../application/use-cases/ListRooms');
const GetMessages = require('../../../application/use-cases/GetMessages');
const SendMessage = require('../../../application/use-cases/SendMessage');

class RoomController {
    constructor(roomRepository, messageRepository) {
        this.createRoom = new CreateRoom(roomRepository);
        this.joinRoom = new JoinRoom(roomRepository);
        this.listRooms = new ListRooms(roomRepository);
        this.getMessages = new GetMessages(messageRepository);
        this.sendMessage = new SendMessage(messageRepository);
    }

    async list(req, res) {
        try {
            const rooms = await this.listRooms.execute();
            res.json({ rooms });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to fetch rooms' });
        }
    }

    async create(req, res) {
        const { name, is_private, password } = req.body;
        if (!name) return res.status(400).json({ message: "name required" });

        const privateRoom = Boolean(is_private);
        let hash = null;

        try {
            if (privateRoom) {
                if (!password) return res.status(400).json({ message: "password required" });
                // In a real clean arch, hashing should be in a service or use case, 
                // but for now we keep it here or move it to use case.
                // Let's keep it simple and assume the Use Case expects the hash or we pass the password and the Use Case hashes it.
                // The Use Case I wrote expects `password_hash`.
                // So I should hash it here or inject a Hasher into the Controller/UseCase.
                // I'll hash it here for simplicity as per the plan to "migrate" not "rewrite everything perfectly".
                const bcrypt = require('bcrypt');
                hash = await bcrypt.hash(password, 10);
            }

            const room = await this.createRoom.execute({ name, is_private: privateRoom, password_hash: hash });
            res.json(room);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to create room" });
        }
    }

    async join(req, res) {
        const roomId = req.params.id;
        const { password } = req.body;
        const userId = req.user.id;

        try {
            // The JoinRoom use case handles the logic.
            // But wait, the original code checked password BEFORE joining.
            // My JoinRoom use case does NOT check password hash because it doesn't have bcrypt.
            // I should probably check the password here if the room is private.
            // But to do that I need the room details first.
            // This suggests `JoinRoom` should return the room or I should fetch it first.
            // Or `JoinRoom` should take the password and validate it.

            // Let's fetch the room first to check password, then call JoinRoom.
            // Or better, let's rely on the Use Case to do it if I inject a Hasher.
            // For now, I'll do it in the controller to match the previous logic's location of "http/routes".

            // Actually, I can't easily fetch the room here without a repository.
            // The controller has access to the repository via the Use Case or directly?
            // Ideally only via Use Case.

            // Let's update `JoinRoom` use case to handle password check?
            // No, I'll keep it simple. I'll instantiate a repository here just for the check? No that's bad.

            // I will use `this.listRooms`? No.
            // I will assume the `JoinRoom` use case just adds the member.
            // I need a `GetRoom` use case?
            // I'll add `GetRoom` logic to `JoinRoom` or just let `JoinRoom` handle it.

            // Let's modify `JoinRoom` to accept `password` and `password_hash` (from DB)?
            // No.

            // I'll stick to the original logic:
            // 1. Get Room (I need a GetRoom use case or use repository directly? I'll use repository directly in controller for pragmatism or add GetRoom).
            // I'll add a `findById` method to `RoomRepository` (already there) and expose it via a `GetRoom` use case?
            // Or just use the repository since I'm injecting it into the controller.
            // Yes, I have `roomRepository` in the constructor.

            const room = await this.roomRepository.findById(roomId);
            if (!room) return res.status(404).json({ message: 'room not found' });

            if (room.is_private) {
                if (!password) return res.status(400).json({ message: 'password required' });
                const bcrypt = require('bcrypt');
                const ok = await bcrypt.compare(password, room.password_hash);
                if (!ok) return res.status(403).json({ message: 'wrong password' });
            }

            await this.joinRoom.execute(userId, roomId);
            res.json({ joined: true, message: 'joined' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to join room' });
        }
    }

    async getRoomMessages(req, res) {
        const roomId = req.params.id;
        try {
            const messages = await this.getMessages.execute(roomId);
            res.json(messages);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to fetch messages' });
        }
    }

    async sendRoomMessage(req, res) {
        const roomId = req.params.id;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content?.trim())
            return res.status(400).json({ message: 'message content required' });

        try {
            const message = await this.sendMessage.execute({ userId, roomId, content });
            res.json(message);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to send message' });
        }
    }
}

module.exports = RoomController;
