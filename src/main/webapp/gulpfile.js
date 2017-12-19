'use strict';

var browserify = require('browserify'),
    connect = require('gulp-connect'),
    source = require('vinyl-source-stream'),
    gulp = require('gulp');

var paths = {
    root : 'app/',
    src : 'app/js/',
    dist : '../resources/html/'
};

gulp.task('browserify', function () {
  return browserify(paths.src + 'app.js', {debug: false})
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(gulp.dest(paths.dist))
  .pipe(connect.reload());
});

gulp.task('watch', ['browserify'], function () {
  gulp.watch([
    paths.src + '**/*.js',
    '!' + paths.src + 'third-party/**',
    paths.test + '**/*.js',
  ], ['browserify']);
});

gulp.task('default', ['browserify']);
