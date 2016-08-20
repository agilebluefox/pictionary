'use strict()';

const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

const app = express();
app.use(express.static('public'));

const server = http.Server(app);
const io = socket_io(server);

let connections = 0; // Counter for the number of connections
let drawer = false; // Boolean for the drawer
let players = {}; // Store the sockets for the players

let logConnections = function (connections) {
    console.log(`Number of clents connected: ${connections}`);
};

// Setup a listener for the connection
io.on('connection', function (socket) {
    console.log('Connecting...');

    // Handle the login and role assignment
    // TODO: As the clients logon the first one becomes the drawer
    // while subsequent clients become guessers
    socket.on('add user', function (username, callback) {
        let role = null;
        if (username in players) {
            callback({ isValid: false });
            return;
        } else if (!drawer) {
            role = 'draw';
            socket.role = 'draw';
            console.log(`${username} is drawing`);
            drawer = true;
        } else {
            role = 'guess';
            socket.role = 'guess';
            console.log(`${username} is guessing`);
        }
        socket.username = username;
        players[socket.username] = socket;
        console.log(Object.keys(players));
        ++connections;
        logConnections(connections);
        callback({ isValid: true});
        socket.emit('new user', {role: role});
    });

    // Broadcast the data to all connected clients when someone is drawing
    socket.on('draw', function (position) {
        socket.broadcast.emit('draw', position);
    });

    socket.on('guess', function (guess) {
        // place the last guess on the display for everyone to see
        io.emit('guess', guess);
    });

    socket.on('disconnect', function () {
        if (!socket.username) return;

        // decrement the number of connections
        --connections;
        logConnections(connections);

        // TODO: When a socket disconnects, find out what role
        // it has and if the socket is a guesser, remove the socket from
        // the players object. If a drawer, grab the first guesser
        // from the players object and make it the drawer.
        if (socket.role === 'draw') {
            drawer = false;
        } 

        delete players[socket.username];
        io.emit('remove user', Object.keys(players));

        console.log(`${socket.username} has left the game`);
    });
});

server.listen(8888);