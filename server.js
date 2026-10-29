const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

io.on('connection', (socket) => {
    console.log('Jugador conectado:', socket.id);

    socket.on('create-room', (callback) => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomCode] = { host: socket.id, players: [socket.id] };
        socket.join(roomCode);
        callback({ success: true, roomCode });
    });

    socket.on('join-room', (roomCode, callback) => {
        if (rooms[roomCode] && rooms[roomCode].players.length < 3) {
            rooms[roomCode].players.push(socket.id);
            socket.join(roomCode);
            let assignedIndex = rooms[roomCode].players.length - 1;
            callback({ success: true, index: assignedIndex, totalPlayers: rooms[roomCode].players.length });
            
            io.to(rooms[roomCode].host).emit('player-joined', { totalPlayers: rooms[roomCode].players.length });
        } else {
            callback({ success: false, message: 'Sala llena o no encontrada' });
        }
    });

    socket.on('game-action', (data) => {
        socket.to(data.roomCode).emit('game-action', data);
    });

    socket.on('disconnect', () => {
        for (let code in rooms) {
            rooms[code].players = rooms[code].players.filter(id => id !== socket.id);
            if (rooms[code].players.length === 0) delete rooms[code];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
