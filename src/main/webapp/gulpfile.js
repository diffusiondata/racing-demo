
const browserify = require('browserify');
const connect = require('gulp-connect');
const source = require('vinyl-source-stream');
const gulp = require('gulp');
const eslint = require('gulp-eslint');

const paths = {
    root: 'app/',
    src: 'app/js/',
    dist: '../../../target/html',
    distDocker: '../../../target/docker-html/html',
};

gulp.task('browserify', () => browserify(`${paths.src}app.js`, { debug: false })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(paths.dist))
    .pipe(gulp.dest(paths.distDocker))
    .pipe(connect.reload()));

gulp.task('watch', gulp.series('browserify', () => {
    gulp.watch([
        `${paths.src}**/*.js`,
        `!${paths.src}third-party/**`,
        `${paths.test}**/*.js`,
    ], ['browserify']);
}));

gulp.task('eslint', () => gulp.src(`${paths.src}**/*.js`)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('default', gulp.series('browserify', 'eslint'));
