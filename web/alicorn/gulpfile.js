'use strict';

var gulp = require('gulp');

var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var es = require('event-stream');

var concat = require('gulp-concat');  
var rename = require('gulp-rename');  
// var uglify = require('gulp-uglify'); 


var stylesheets = {};
stylesheets.input = [ './vendor/**/*.css', './src/scss/main.scss' ];
stylesheets.concat = [ './vendor/**/*.css' ];
stylesheets.watch = [ './vendor/**/*.css', './vendor/**/*.scss', './src/scss/**/*.scss' ];
stylesheets.output = './css';

var javascripts = {};
javascripts.input = [];
// javascripts.input.push('./vendor/leaflet/dist/leaflet-src.js');
// javascripts.input.push('./vendor/leaflet/plugins/leaflet-iiif.js');
// javascripts.input.push('./vendor/leaflet/plugins/tooltip.patches.js');
// javascripts.input.push('./vendor/leaflet/plugins/easy-button.js');
// javascripts.input.push('./vendor/bigfoot/dist/bigfoot.js');
javascripts.input.push('./node_modules/jquery/dist/jquery.js');
javascripts.input.push('./node_modules/headjs/dist/1.0.0/head.js');
javascripts.input.push('./vendor/micromodal/micromodal.js');
javascripts.input.push('./src/js/components/**/*.js', './src/js/main.js')
javascripts.output = './js';

stylesheets.options = {
  errLogToConsole: true,
  outputStyle: 'expanded',
  includePaths: ['node_modules']
};

var autoprefixerOptions = {
  browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};

// Compile sass into CSS
gulp.task('sass', function() {

  var vendorFiles = gulp.src(stylesheets.concat);

  var localFiles = gulp.src('./src/scss/main.scss')
    .pipe(sass(stylesheets.options).on('error', sass.logError))
    .pipe(autoprefixer(autoprefixerOptions));

  return es.concat(vendorFiles, localFiles)
    .pipe(concat('main.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(stylesheets.output));
});

gulp.task('scripts', function() {
  return gulp.src(javascripts.input)
    .pipe(sourcemaps.init())
      .pipe(concat('utils.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(javascripts.output))
})

gulp.task('sass:watch', function () {
  gulp.watch(stylesheets.watch, gulp.parallel('sass'));
});

gulp.task('scripts:watch', function () {
  gulp.watch(javascripts.input, gulp.parallel('scripts'));
});

gulp.task('default', gulp.parallel('sass:watch', 'scripts:watch'));
gulp.task('run', gulp.series('sass', 'scripts'));