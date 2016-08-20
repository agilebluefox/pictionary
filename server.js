'use strict';
'use strict()';

var http = require('http');
var express = require('express');
var socket_io = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

var connections = 0; // Counter for the number of connections
var drawer = false; // Boolean for the drawer
var players = {}; // Store the sockets for the players

var logConnections = function logConnections(connections) {
    console.log('Number of clents connected: ' + connections);
};

// Setup a listener for the connection
io.on('connection', function (socket) {
    console.log('Connecting...');

    // Handle the login and role assignment
    // TODO: As the clients logon the first one becomes the drawer
    // while subsequent clients become guessers
    socket.on('add user', function (username, callback) {
        var role = null;
        if (username in players) {
            callback({ isValid: false });
            return;
        } else if (!drawer) {
            role = 'draw';
            socket.role = 'draw';
            console.log(username + ' is drawing');
            drawer = true;
        } else {
            role = 'guess';
            socket.role = 'guess';
            console.log(username + ' is guessing');
        }
        socket.username = username;
        players[socket.username] = socket;
        console.log(Object.keys(players));
        ++connections;
        logConnections(connections);
        callback({ isValid: true });
        socket.emit('set role', { role: role });
    });

    // Broadcast the data to all connected clients when someone is drawing
    socket.on('draw', function (position) {
        socket.broadcast.emit('draw', position);
    });

    socket.on('guess', function (guess) {
        // place the last guess on the display for everyone to see
        io.emit('guess', guess);
    });

    socket.on('correct guess', function () {
        console.log('The last guess is correct - Game Over!');
    });

    socket.on('disconnect', function () {
        if (!socket.username) return;
        var role = socket.role;
        console.log(socket.username + '\'s role is ' + socket.role);

        // decrement the number of connections
        --connections;
        logConnections(connections);

        // TODO: When a socket disconnects, find out what role
        // it has and if the socket is a guesser, remove the socket from
        // the players object. If a drawer, grab the first guesser
        // from the players object and make it the drawer.
        delete players[socket.username];

        if (role === 'draw') {
            // Get the next guesser and make that user the one who draws
            for (var player in players) {
                console.log(players[player].role);
                if (players[player].role === 'guess') {
                    console.log('In the loop');
                    players[player].role = 'draw';
                    players[player].emit('set role', { role: 'draw' });
                    console.log(players[player].username + ' is the new drawer!');
                    break;
                }
            }
        }

        // io.emit('remove user', Object.keys(players));
        console.log(Object.keys(players));
        console.log(socket.username + ' has left the game');
    });
});

server.listen(8888);