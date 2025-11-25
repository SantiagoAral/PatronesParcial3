const http = require('http');
const RabbitMQBroker = require('./infrastructure/messaging/RabbitMQBroker');
const PostgresMessageRepository = require('./infrastructure/persistence/PostgresMessageRepository');
const ChatHandler = require('./interfaces/websocket/handlers/ChatHandler');
const WebSocketServer = require('./interfaces/websocket/WebSocketServer');

const port = process.env.PORT || 4000;
const server = http.createServer();

// Dependency Injection
const broker = new RabbitMQBroker();
const messageRepository = new PostgresMessageRepository();
const chatHandler = new ChatHandler(messageRepository, broker);

// Start WebSocket Server
new WebSocketServer(server, chatHandler, broker);

server.listen(port, () => {
  console.log(`✅ WebSocket server started on port ${port}`);
});
