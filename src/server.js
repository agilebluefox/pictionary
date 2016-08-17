'use strict()';

const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

const app = express();
app.use(express.static('public'));

const server = http.Server(app);
const io = socket_io(server);

// Setup a listener for the connection
io.on('connection', function (socket) {
    console.log('Client connected...');

    // Broadcast the data to all connected clients when someone is drawing
    socket.on('draw', function (position) {
        socket.broadcast.emit('draw', position);
    });
});

server.listen(8888);