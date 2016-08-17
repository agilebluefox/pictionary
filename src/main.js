'use strict()';

let pictionary = function () {
    let canvas, context;
    let socket = io.connect();
    let drawing = false;

    let draw = function (position) {
        context.beginPath();
        context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
        context.fill();
    };

    canvas = $('canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;

    // Set drawing to true when the mouse is down
    canvas.on('mousedown', function () {
        drawing = true;
    });

    // Set drawing to false when the mouse is up
    canvas.on('mouseup', function () {
        drawing = false;
    });

    // Draw when the mouse is pressed and moved around the canvas
    canvas.on('mousemove', function (event) {
        if (drawing) {

            let offset = canvas.offset();
            let position = {
                x: event.pageX - offset.left,
                y: event.pageY - offset.top
            };
            draw(position);
            // Send the position data with the draw event
            socket.emit('draw', position);
        }
    });
    // Draw the data received from other clients
    socket.on('draw', function (position) {
        draw(position);
    });
};

$(document).ready(function () {
    pictionary();
});