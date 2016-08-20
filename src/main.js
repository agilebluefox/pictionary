'use strict()';

let pictionary = function () {
    let $window = $(window);
    let $context, $canvas;
    let $usernameInput = $('.usernameInput'); // Input for username
    let $error = $('.error'); // Username error
    let $loginPage = $('.login-page'); // The login page
    let $main = $('#main'); // The canvas and elements for the game

    let $currentInput = $usernameInput.focus();

    let username = null;
    let socket = io.connect();
    let drawing = false;
    let role = null;


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
            $window.off('keydown');
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
                $loginPage.off('click');
                $loginPage.off('keydown');

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
    let $currentWord = $('#word');
    let $correctGuess = $('#correct-guess');

    // Get the target for the guess
    let $guessBox = $('#guess');
    let $guessInput = $('#guess input');
    // Get the target to store the last guess
    let $lastGuess = $('#last-guess');


    $canvas = $('#canvas');
    $context = $canvas[0].getContext('2d');
    $canvas[0].width = $canvas[0].offsetWidth;
    $canvas[0].height = $canvas[0].offsetHeight;
    let draw = function (position) {
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

                    let offset = $canvas.offset();
                    let position = {
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

            let onKeyDown = function (event) {
                if (event.keyCode != 13) {
                    return;
                }
                let guess = $guessInput.val();
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