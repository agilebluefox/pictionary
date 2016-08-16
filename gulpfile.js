'use strict()';

const gulp = require('gulp');
const del = require('del');
const babel = require('gulp-babel');
const watch = require('gulp-watch');

/**
 * Clean tasks
 */

// Clean up the public directory prior to a build
gulp.task('clean:html', () => {
     return del(['public/*.html']);
});

gulp.task('clean:css', () => {
     return del(['public/*.css']);
});

gulp.task('clean:js', () => {
     return del(['public/main.js', 'server.js']);
});

/**
 * HTML tasks
 */

// Add the index file to the public directory
gulp.task('add-index', ['clean:html'], () => {
    return gulp.src('./src/index.html')
    // .pipe(watch('./src/index.html'))
    .pipe(gulp.dest('public/'));
});

/**
 * CSS tasks
 */

// Add the css file to the public directory
gulp.task('add-css', ['clean:css'], () => {
    return gulp.src('./src/styles.css')
    .pipe(gulp.dest('public/'));
});

/**
 * JS tasks
 */

gulp.task('main-js', ['clean:js'], () => {
    return gulp.src('src/main.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('public/'));
});

gulp.task('server-js', ['main-js'], () => {
    return gulp.src('src/server.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('./'));
});

/**
 * Watch tasks
 */

gulp.task('watch', () => {
    gulp.watch('src/index.html', ['add-index']);
    gulp.watch('src/styles.css', ['add-css']);
    gulp.watch('src/main.js', ['main-js']);
    gulp.watch('src/server.js', ['server-js']);
});

// Default task that runs everything
gulp.task('default', ['add-index', 'add-css', 'main-js', 'server-js']);