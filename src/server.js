'use strict()';

const http = require('http');
const express = require('express');
const socket_io = require('socket_io');

const app = express();
app.use(express.static('public'));

const server = http.Server(app);
const io = socket_io(server);

server.listen(8888);