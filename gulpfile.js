/* eslint-disable func-names */
const {
  series, src, dest, watch, parallel,
} = require('gulp');
const pug = require('gulp-pug-3');
const newer = require('gulp-newer');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const iconfont = require('gulp-iconfont');
const iconfontCSS = require('gulp-iconfont-css');
const imagemin = require('gulp-imagemin');

/* ---------------------------------------------------------------
 *  Settings
 *  -------------------------------------------------------------*/
// All source files and folders are placed in the "src" directory,
// the processed files will be compiled to the "dist" folder

// The settings below specify the directory for the different
// languages handled by gulp

const settings = {
  pug: {
    src: 'src/pug/**/*.pug',
    dest: 'dist',
  },
  sass: {
    src: 'src/sass/**/*.scss',
    dest: 'dist/assets/css',
    includePaths: ['node_modules/foundation-sites/scss'],
    outputStyle: 'expanded',
  },
  js: {
    src: 'src/js/**/*.js',
    dest: 'dist/assets/js',
  },
  fonts: {
    src: 'src/fonts/**/*.*',
    dest: 'dist/assets/fonts',
  },
  img: {
    src: 'src/img/**/*.*',
    dest: 'dist/assets/img',
  },
  iconfont: {
    src: 'src/iconfonts/**/*.*',
    path: 'src/icon-font-template.scss',
    dest: 'dist/assets/fonts',
    fontName: 'iconfonts',
    targetPath: '../../../src/sass/components/iconfonts.scss', // The path where the (S)CSS file should be saved, relative to the path used in gulp.dest() (optional, defaults to _icons.css).
    fontPath: '/assets/fonts/', // Directory of font files relative to generated (S)CSS file (optional, defaults to ./)
  },
};

// Utility Functions -----------------------------------------------------
// Task error handler
const onError = function (error, message) {
  notify({
    title: 'Error in Build',
    message,
  }).write(error);

  gutil.log(gutil.colors.bgRed(message));
  this.emit('end');
};

/* ---------------------------------------------------------------
 *  Gulp Tasks
 *  -------------------------------------------------------------*/

/**
 * Pug Task
 * pugTask compiles pug to html
 */
function pugTask() {
  return src(settings.pug.src)
    .pipe(plumber({
      errorHandler: onError,
    }))
    .pipe(pug())
    .pipe(dest(settings.pug.dest));
}

/**
 * Iconfont Task
 * iconfontTask converts SVG icons to icon fonts
 */
function iconfontTask() {
  return src(settings.iconfont.src)
    .pipe(plumber({
      errorHandler: onError,
    }))
    .pipe(iconfontCSS({
      path: settings.iconfont.path,
      fontName: settings.iconfont.fontName,
      targetPath: settings.iconfont.targetPath,
      fontPath: settings.iconfont.fontPath,
    }))
    .pipe(iconfont({
      fontName: settings.iconfont.fontName,
      // prependUnicode: true,
      formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
      timestamp: Math.round(Date.now() / 1000),
      normalize: true,
      fontHeight: 1001,
    }))
    .pipe(dest(settings.iconfont.dest));
}

/**
 * Sass Task
 * sassTask compiles sass files to css and auto-inject into open browsers
 */
function sassTask() {
  return src(settings.sass.src)
    .pipe(sourcemaps.init())
    .pipe(plumber({
      errorHandler: onError,
    }))
    .pipe(sass({
      outputStyle: settings.sass.outputStyle,
      includePaths: settings.sass.includePaths,
    }))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./sass-maps'))
    .pipe(dest(settings.sass.dest))
    .pipe(browserSync.stream());
}

/**
 * Font Task
 * fontTask copies fonts placed in the source directory to the destination directory
 */
function fontTask() {
  return src(settings.fonts.src)
    .pipe(dest(settings.fonts.dest));
}

/**
 * Image Task
 * imageTasks compresses optimises GIF, JPG, PNG and SVG images
 */
function imageTask() {
  return src(settings.img.src)
    .pipe(newer(settings.img.dest))
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true,
      }),
      imagemin.jpegtran({
        progressive: true,
      }),
      imagemin.optipng({
        optimizationLevel: 5,
      }),
      imagemin.svgo({
        plugins: [{
          removeViewBox: true,
        },
        {
          cleanupIDs: false,
        },
        ],
      }),
    ], {
      verbose: true,
    }))
    .pipe(dest(settings.img.dest));
}

browserSync.init({
  server: {
    baseDir: './dist',
  },
});

function reload(done) {
  browserSync.reload();
  return done();
}

exports.build = function () {
  settings.sass.outputStyle = 'compact';
  parallel(sassTask, fontTask, imageTask, iconfontTask);
};

exports.default = function () {
  // Watch pugfile and transpile
  watch(settings.pug.src,
    { ignoreInitial: false },
    series(pugTask, reload));

  // Watch sass files
  watch(settings.sass.src, sassTask);

  // Watch font files
  watch(settings.fonts.src, fontTask);

  // Watch image files
  watch(settings.img.src, imageTask);

  // Watch icon files
  watch(settings.iconfont.src, iconfontTask);

  // Watch JS files and reload
  watch(`${settings.js.dest}/**/*.js`, reload);
};
