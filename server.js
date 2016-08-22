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
var drawer = null; // Store the username of the drawer
var players = {}; // Store the sockets for the players
var word = null; // Store the current word for the game

var pickWord = function pickWord() {
    var WORDS = ["word", "letter", "number", "person", "pen", "class", "people", "sound", "water", "side", "place", "man", "men", "woman", "women", "boy", "girl", "year", "day", "week", "month", "name", "sentence", "line", "air", "land", "home", "hand", "house", "picture", "animal", "mother", "father", "brother", "sister", "world", "head", "page", "country", "question", "answer", "school", "plant", "food", "sun", "state", "eye", "city", "tree", "farm", "story", "sea", "night", "day", "life", "north", "south", "east", "west", "child", "children", "example", "paper", "music", "river", "car", "foot", "feet", "book", "science", "room", "friend", "idea", "fish", "mountain", "horse", "watch", "color", "face", "wood", "list", "bird", "body", "dog", "family", "song", "door", "product", "wind", "ship", "area", "rock", "order", "fire", "problem", "piece", "top", "bottom", "king", "space"];
    var min = 0;
    var max = WORDS.length;
    var rand = Math.floor(Math.random() * (max - min) + min);
    return WORDS[rand];
};

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
            drawer = username;
            word = pickWord();
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
        socket.emit('set role', { role: role, word: word });
    });

    // Broadcast the data to all connected clients when someone is drawing
    socket.on('draw', function (position) {
        socket.broadcast.emit('draw', position);
    });

    socket.on('guess', function (guess) {
        // place the last guess on the display for everyone to see
        io.emit('guess', guess);
        if (guess === word) {
            var username = socket.username;
            console.log(username + ' is the winner!');
            io.emit('winner', { winner: username, word: word });
            players[drawer].role = 'guess';
            players[drawer].emit('set role', { role: 'guess' });
            players[username].role = 'draw';
            word = pickWord();
            players[username].emit('set role', { role: 'draw', word: word });
            drawer = username;
            io.emit('new game');
        }
    });

    socket.on('disconnect', function () {
        var role = socket.role;
        var username = socket.username;
        if (!username) return;
        console.log(username + '\'s role is ' + role);

        // decrement the number of connections
        --connections;
        logConnections(connections);

        // TODO: When a socket disconnects, find out what role
        // it has and if the socket is a guesser, remove the socket from
        // the players object. If a drawer, grab the first guesser
        // from the players object and make it the drawer.
        delete players[username];

        if (username === drawer) {
            drawer = null;
            // Get the next guesser and make that user the one who draws
            for (var player in players) {
                console.log(players[player].role);
                if (players[player].role === 'guess') {
                    console.log('In the loop');
                    players[player].role = 'draw';
                    drawer = players[player].username;
                    word = pickWord();
                    players[player].emit('set role', { role: 'draw', word: word });
                    io.emit('new game');
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