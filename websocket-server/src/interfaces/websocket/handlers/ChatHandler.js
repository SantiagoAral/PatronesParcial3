const HandleSubscription = require('../../../application/use-cases/HandleSubscription');
const HandleMessage = require('../../../application/use-cases/HandleMessage');
const HandleDisconnect = require('../../../application/use-cases/HandleDisconnect');
const Session = require('../../../domain/entities/Session');

class ChatHandler {
    constructor(messageRepository, broker) {
        this.handleSubscription = new HandleSubscription(messageRepository);
        this.handleMessage = new HandleMessage(messageRepository, broker);
        this.handleDisconnect = new HandleDisconnect();
    }

    async handleConnection(ws, user, broadcastCallback) {
        const session = new Session(ws, user);
        session.send({ type: "WELCOME", user: user.username });

        ws.on("message", async (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch {
                console.error("Invalid JSON:", raw);
                return;
            }

            if (msg.type === "SUBSCRIBE") {
                await this.handleSubscription.execute(session, String(msg.roomId), broadcastCallback);
            } else if (msg.type === "UNSUBSCRIBE") {
                session.unsubscribe(String(msg.roomId));
                broadcastCallback(String(msg.roomId), { type: "USER_LEAVE", user: user.username });
            } else if (msg.type === "MESSAGE") {
                await this.handleMessage.execute(session, String(msg.roomId), msg.content);
            }
        });

        ws.on("close", () => {
            this.handleDisconnect.execute(session, broadcastCallback);
        });

        return session;
    }
}

module.exports = ChatHandler;
