const amqp = require('amqplib');

class RabbitMQBroker {
    constructor() {
        this.channel = null;
    }

    async connect() {
        if (this.channel) return this.channel;
        const url = process.env.RABBIT_URL || 'amqp://localhost';
        const conn = await amqp.connect(url);
        this.channel = await conn.createChannel();
        await this.channel.assertExchange('chat.messages', 'topic', { durable: true });
        return this.channel;
    }

    async publish(roomId, payload) {
        const ch = await this.connect();
        const key = `room.${roomId}`;
        ch.publish('chat.messages', key, Buffer.from(JSON.stringify(payload)), { persistent: true });
    }

    async subscribe(onMessage) {
        const ch = await this.connect();
        const q = await ch.assertQueue('', { exclusive: true });
        // bind to all room messages
        await ch.bindQueue(q.queue, 'chat.messages', 'room.*');
        ch.consume(q.queue, (msg) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    onMessage(content);
                    ch.ack(msg);
                } catch (e) {
                    ch.nack(msg);
                }
            }
        }, { noAck: false });
    }
}

module.exports = RabbitMQBroker;
