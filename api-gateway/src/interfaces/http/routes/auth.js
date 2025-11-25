const express = require('express');
const AuthController = require('../controllers/AuthController');
const PostgresUserRepository = require('../../../infrastructure/persistence/PostgresUserRepository');

const router = express.Router();

// Dependency Injection
const userRepository = new PostgresUserRepository();
const authController = new AuthController(userRepository);

// Routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

module.exports = router;
