'use strict';
'use strict()';

var pictionary = function pictionary() {
    var $window = $(window);
    var $context = void 0,
        $canvas = void 0;
    var $usernameInput = $('.usernameInput'); // Input for username
    var $error = $('.error'); // Username error
    var $loginPage = $('.login-page'); // The login page
    var $main = $('#main'); // The canvas and elements for the game

    var $currentInput = $usernameInput.focus();

    var username = null;
    var socket = io.connect();
    var drawing = false;
    var role = null;

    $window.on('keydown', function (event) {
        // if (!(event.ctrlKey || event.metaKey || event.altKey)) {
        //     $currentInput.focus();
        // }

        if (event.which === 13) {
            if (!username) {
                setUsername();
            } else {
                return;
            }
        }
    });

    // Get the username val from the input
    // Check that it's unique
    function setUsername() {
        username = $usernameInput.val().trim();

        socket.emit('add user', username, function (data) {
            if (data.isValid) {
                $loginPage.fadeOut();
                $main.show();
                // $loginPage.off('click');
                // $loginPage.off('keydown');
            } else {
                username = null;
                $usernameInput.val('');
                $error.html('Username already taken. Try again.');
                $currentInput = $usernameInput.focus();
            }
            return;
        });
    }

    // Get the targets for the drawer interface
    var $currentWord = $('#word');
    var $correctGuess = $('#correct-guess');

    // Get the target for the guess
    var $guessBox = $('#guess');
    var $guessInput = $('#guess input');
    // Get the target to store the last guess
    var $lastGuess = $('#last-guess');

    $canvas = $('canvas');
    $context = $canvas[0].getContext('2d');
    $canvas[0].width = $canvas[0].offsetWidth;
    $canvas[0].height = $canvas[0].offsetHeight;
    var draw = function draw(position) {
        $context.fillStyle = 'black';
        $context.beginPath();
        $context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
        $context.fill();
    };

    socket.on('new user', function (data) {
        $lastGuess.show();
        console.log(data.role);

        if (data.role === 'draw') {

            $currentWord.show();
            $correctGuess.show();

            // Set drawing to true when the mouse is down
            $canvas.on('mousedown', function () {
                drawing = true;
            });

            // Set drawing to false when the mouse is up
            $canvas.on('mouseup', function () {
                drawing = false;
            });

            // Draw when the mouse is pressed and moved around the canvas
            $canvas.on('mousemove', function (event) {

                if (drawing) {

                    var offset = $canvas.offset();
                    var position = {
                        x: event.pageX - offset.left,
                        y: event.pageY - offset.top
                    };
                    draw(position);
                    // Send the position data with the draw event
                    socket.emit('draw', position);
                }
            });
        } else if (data.role === 'guess') {

            $guessBox.show();
            $guessInput.show();

            var onKeyDown = function onKeyDown(event) {
                if (event.keyCode != 13) {
                    return;
                }
                var guess = $guessInput.val();
                // Send the guess to everyone
                socket.emit('guess', guess);
                $guessInput.val('');
            };
            $guessInput.on('keydown', onKeyDown);
        } else {
            console.log('Role not assigned properly!');
        }
    });
    // When a guess is received, log it to the display ...
    socket.on('guess', function (guess) {
        // ... and console
        console.log(guess);
        $lastGuess.text(guess);
    });

    // Draw the data received from other clients
    socket.on('draw', function (position) {
        draw(position);
    });

    // Add method of checking to see if the guess is correct
};

$(document).ready(function () {
    pictionary();
});