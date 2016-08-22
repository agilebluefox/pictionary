'use strict()';

const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

const app = express();
app.use(express.static('public'));

const server = http.Server(app);
const io = socket_io(server);

let connections = 0; // Counter for the number of connections
let drawer = null; // Store the username of the drawer
let players = {}; // Store the sockets for the players
let word = null; // Store the current word for the game

let pickWord = function () {
    const WORDS = [
        "word", "letter", "number", "person", "pen", "class", "people",
        "sound", "water", "side", "place", "man", "men", "woman", "women", "boy", "girl", "year", "day", "week", "month", "name", "sentence", "line", "air", "land", "home", "hand", "house", "picture", "animal", "mother", "father", "brother", "sister", "world", "head", "page", "country", "question", "answer", "school", "plant", "food", "sun", "state", "eye", "city", "tree", "farm", "story", "sea", "night", "day", "life", "north", "south", "east", "west", "child", "children", "example", "paper", "music", "river", "car", "foot", "feet", "book", "science", "room", "friend", "idea", "fish", "mountain", "horse", "watch", "color", "face", "wood", "list", "bird", "body", "dog", "family", "song", "door", "product", "wind", "ship", "area", "rock", "order", "fire", "problem", "piece", "top", "bottom", "king", "space"
    ];
    let min = 0;
    let max = WORDS.length;
    let rand = Math.floor(Math.random() * (max - min) + min);
    return WORDS[rand];
};

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
        // If the username exists send an error
        if (username in players) {
            callback({ isValid: false });
            return;
            // If there isn't a drawer, this player becomes the drawer
        } else if (!drawer) {
            role = 'draw';
            socket.role = 'draw';
            console.log(`${username} is drawing`);
            drawer = username;
            word = pickWord();
            // If a drawer exists, make the player a guesser
        } else {
            role = 'guess';
            socket.role = 'guess';
            console.log(`${username} is guessing`);
        }
        // Store the username and role on the socket object
        socket.username = username;
        players[socket.username] = socket;
        console.log(Object.keys(players));
        ++connections;
        logConnections(connections);
        callback({ isValid: true });
        // Send the role to be stored on the client object too
        socket.emit('set role', { role: role, word: word });
    });

    // Broadcast the data to all connected clients when someone is drawing
    socket.on('draw', function (position) {
        socket.broadcast.emit('draw', position);
    });

    socket.on('guess', function (guess) {
        // place the last guess on the display for everyone to see
        io.emit('guess', guess);

        // Check the guess to see if it's correct
        if (guess === word) {
            // Get the username of the winner
            let username = socket.username;
            console.log(`${username} is the winner!`);
            // Announce the winner and the word
            io.emit('winner', { winner: username, word: word });

            // Update the roles of the players
            players[drawer].role = 'guess';
            players[drawer].emit('set role', { role: 'guess' });
            players[username].role = 'draw';
            // Get a new word to draw
            word = pickWord();
            players[username].emit('set role', { role: 'draw', word: word });
            drawer = username;
            // Reset the game
            io.emit('new game');
        }
    });

    socket.on('disconnect', function () {
        let role = socket.role;
        let username = socket.username;
        if (!username) return;
        console.log(`${username}'s role is ${role}`);

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
            for (let player in players) {
                console.log(players[player].role);
                if (players[player].role === 'guess') {
                    console.log('In the loop');
                    players[player].role = 'draw';
                    drawer = players[player].username;
                    // Get a new word
                    word = pickWord();
                    players[player].emit('set role', { role: 'draw', word: word });
                    // Start a new game with the new drawer
                    io.emit('new game');
                    console.log(`${players[player].username} is the new drawer!`);
                    break;
                }
            }
        }

        // io.emit('remove user', Object.keys(players));
        console.log(Object.keys(players));
        console.log(`${socket.username} has left the game`);
    });
});

server.listen(8888);