'use strict';
'use strict()';

var pictionary = function pictionary() {
    var canvas = void 0,
        context = void 0;
    var socket = io.connect();
    var drawing = false;

    var draw = function draw(position) {
        context.beginPath();
        context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
        context.fill();
    };

    canvas = $('canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;

    canvas.on('mousedown', function () {
        drawing = true;
    });

    canvas.on('mouseup', function () {
        drawing = false;
    });

    canvas.on('mousemove', function (event) {
        if (drawing) {

            var offset = canvas.offset();
            var position = {
                x: event.pageX - offset.left,
                y: event.pageY - offset.top
            };
            draw(position);
            socket.emit('draw', position);
        }
    });

    socket.on('draw', function (position) {
        draw(position);
    });
};

$(document).ready(function () {
    pictionary();
});