const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const roomsRoutes = require('./routes/rooms'); // rutas de salas
const authRoutes = require('./routes/auth'); // rutas de auth (login/register)

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Montar rutas
app.use('/auth', authRoutes);
app.use('/rooms', roomsRoutes);

// Ruta de salud
app.get('/health', (_, res) => res.json({ ok: true }));

// Puerto donde va a escuchar Express
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




