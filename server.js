'use strict';
'use strict()';

var http = require('http');
var express = require('express');
var socket_io = require('socket_io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

server.listen(8888);