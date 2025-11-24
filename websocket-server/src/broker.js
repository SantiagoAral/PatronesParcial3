const amqp = require('amqplib');

let channel = null;

async function connect() {
  if (channel) return channel;
  const url = process.env.RABBIT_URL || 'amqp://localhost';
  const conn = await amqp.connect(url);
  channel = await conn.createChannel();
  await channel.assertExchange('chat.messages', 'topic', { durable: true });
  return channel;
}

async function publish(roomId, payload) {
  const ch = await connect();
  const key = `room.${roomId}`;
  ch.publish('chat.messages', key, Buffer.from(JSON.stringify(payload)), { persistent: true });
}

async function subscribe(onMessage) {
  const ch = await connect();
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

module.exports = { connect, publish, subscribe };
