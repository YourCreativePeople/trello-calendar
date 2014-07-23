/* Gulp File
    v 0.1.1
*/
var gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    uglify      = require('gulp-uglify'),
    concat      = require('gulp-concat'),
    livereload  = require('gulp-livereload'),
    watch       = require('gulp-watch'),
    less        = require('gulp-less'),
    minifyCSS   = require('gulp-minify-css'),
    filesize    = require('gulp-filesize'),
    lr          = require('tiny-lr');

var EXPRESS_PORT    = 4001;
var EXPRESS_ROOT    = __dirname;
var LIVERELOAD_PORT = 35730;

var paths = {
  scripts:          ['js/*.js'],
  vendorscripts:    ['vendor/js/*.js'],
  styles:           ['css/*.less']
};

gulp.task('server', function () {
    var express = require('express');
    var app = express();
    app.use(require('connect-livereload')());
    app.use(express.static(EXPRESS_ROOT));
    app.listen(EXPRESS_PORT);

    gutil.log('Express Server on Port ' + gutil.colors.bgBlue.white(' ' + EXPRESS_PORT + ' '));
});

gulp.task('livereload', function() {
    lr().listen(LIVERELOAD_PORT);
});

gulp.task('js', function () {
    return gulp.src(paths.scripts)
        //.pipe(uglify())
        .pipe(concat('scripts.min.js'))
        .pipe(gulp.dest('build/js'))
        .on('error', gutil.log)
        .pipe(livereload());
});

gulp.task('vendorjs', function() {
    return gulp.src(paths.vendorscripts)
        .pipe(uglify())
        .pipe(concat('vendorscripts.min.js'))
        .pipe(gulp.dest('build/js'))
        .on('error', gutil.log)
        .pipe(livereload());
});

gulp.task('less', function () {
    return gulp.src(paths.styles)
        .pipe(less())
        // .pipe(minifyCSS())
        .pipe(concat('styles.min.css'))
        .pipe(gulp.dest('build/css'))
        .pipe(livereload());
});

// Rerun the task when a file changes
gulp.task('watch', function () {
    gulp.watch(paths.scripts, ['js']);
    gulp.watch(paths.styles, ['less']);
    gulp.watch('*.html', notifyLivereload);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'server', 'livereload', 'js', 'vendorjs', 'less']);

// Notifies livereload of changes detected
// by `gulp.watch()`
function notifyLivereload(event) {

  gulp.src(event.path, {read: false})
    .pipe(livereload());
}