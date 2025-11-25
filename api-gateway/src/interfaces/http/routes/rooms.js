const express = require('express');
const { authenticate } = require('../middleware/auth');
const RoomController = require('../controllers/RoomController');
const PostgresRoomRepository = require('../../../infrastructure/persistence/PostgresRoomRepository');
const PostgresMessageRepository = require('../../../infrastructure/persistence/PostgresMessageRepository');

const router = express.Router();

// Dependency Injection
const roomRepository = new PostgresRoomRepository();
const messageRepository = new PostgresMessageRepository();
const roomController = new RoomController(roomRepository, messageRepository);

// Routes
router.get('/list', authenticate, (req, res) => roomController.list(req, res));
router.post('/create', authenticate, (req, res) => roomController.create(req, res));
router.post('/:id/join', authenticate, (req, res) => roomController.join(req, res));
router.get('/:id/messages', authenticate, (req, res) => roomController.getRoomMessages(req, res));
router.post('/:id/messages', authenticate, (req, res) => roomController.sendRoomMessage(req, res));

module.exports = router;
