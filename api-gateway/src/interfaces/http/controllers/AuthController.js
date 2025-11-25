const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthController {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async register(req, res) {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        try {
            const existing = await this.userRepository.findByUsername(username);
            if (existing) {
                return res.status(400).json({ message: "Username taken" });
            }

            const hash = await bcrypt.hash(password, 10);
            const user = await this.userRepository.create({ username, password_hash: hash });

            res.json({ id: user.id, username: user.username });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Register failed" });
        }
    }

    async login(req, res) {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        try {
            const user = await this.userRepository.findByUsername(username);
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Generate Token
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET || "secret_key",
                { expiresIn: "1h" }
            );

            res.json({ token, user: { id: user.id, username: user.username } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Login failed" });
        }
    }
}

module.exports = AuthController;
