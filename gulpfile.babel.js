/*
 * Copyright (c) 2013, Divio AG
 * Licensed under BSD
 * http://github.com/aldryn/aldryn-boilerplate-bootstrap3
 */

// #############################################################################
// IMPORTS
import minimist from 'minimist';
import autoprefixer from 'gulp-autoprefixer';
import bower from 'gulp-bower';
import browserSync from 'browser-sync';
import cache from 'gulp-cached';
import gulp from 'gulp';
import gutil from 'gulp-util';
import gulpif from 'gulp-if';
import iconfont from 'gulp-iconfont';
import iconfontCss from 'gulp-iconfont-css';
import imagemin from 'gulp-imagemin';
import jshint from 'gulp-jshint';
import jscs from 'gulp-jscs';
import { server as karma } from 'karma';
import minifyCss from 'gulp-minify-css';
import {
    protractor, webdriver_update as webdriverUpdate
} from 'gulp-protractor';
import sass from 'gulp-sass';
// import scsslint from 'gulp-scss-lint';
import sourcemaps from 'gulp-sourcemaps';
import yuidoc from 'gulp-yuidoc';

const argv = minimist(process.argv.slice(2));

// #############################################################################
// SETTINGS
const PROJECT_ROOT = __dirname;
const PROJECT_PATH = {
    bower: `${PROJECT_ROOT}/static/vendor`,
    css: `${PROJECT_ROOT}/static/css`,
    docs: `${PROJECT_ROOT}/static/docs`,
    fonts:  `${PROJECT_ROOT}/static/fonts`,
    html: `${PROJECT_ROOT}/templates`,
    images: `${PROJECT_ROOT}/static/img`,
    icons: `${PROJECT_ROOT}/private/icons`,
    js: `${PROJECT_ROOT}/static/js`,
    sass: `${PROJECT_ROOT}/private/sass`,
    tests: `${PROJECT_ROOT}/tests`,
};

const PROJECT_PATTERNS = {
    images: [
        `${PROJECT_PATH.images}/**/*`,
        // exclude from preprocessing
        `!${PROJECT_PATH.images}/dummy/*/**`,
    ],
    js: [
        `gulpfile.babel.js`,
        `${PROJECT_PATH.js}/**/*.js`,
        `${PROJECT_PATH.tests}/**/*.js`,
        // exclude from linting
        `!${PROJECT_PATH.js}/*.min.js`,
        `!${PROJECT_PATH.js}/**/*.min.js`,
        `!${PROJECT_PATH.tests}/coverage/**/*`,
    ],
    sass: [
        `${PROJECT_PATH.sass}/**/*.{scss,sass}`,
    ],
};

const PORT = parseInt(process.env.PORT, 10) || 8000;
const DEBUG = argv.debug;

// #############################################################################
// LINTING
gulp.task('lint', ['lint:javascript']);

gulp.task('lint:javascript', () =>
    // DOCS: http://jshint.com/docs/
    gulp.src(PROJECT_PATTERNS.js)
        .pipe(jshint())
        .pipe(jscs())
        .on('error', function (error) {
            gutil.log(`\n${error.message}`);
            if (process.env.CI) {
                // force the process to exit with error code
                process.exit(1);
            }
        })
        .pipe(jshint.reporter('jshint-stylish'))
);

/* FIXME: disabled for now
gulp.task('lint:sass', () =>
    // DOCS: https://github.com/brigade/scss-lint/
    gulp.src(PROJECT_PATTERNS.sass)
        .pipe(cache('scsslint'))
        .pipe(scsslint({
            config: './scss-lint.json'
        }))
);
*/

// #############################################################################
// PREPROCESSING
gulp.task('preprocess', ['sass', 'images', 'docs']);

gulp.task('sass', () =>
    gulp.src(PROJECT_PATTERNS.sass)
        // sourcemaps can be activated through `gulp sass --debug´
        .pipe(gulpif(DEBUG, sourcemaps.init()))
        .pipe(sass())
        .on('error', function (error) {
            gutil.log(gutil.colors.red(
                `Error (${error.plugin}): ${error.messageFormatted}`
            ));
            // used on Aldryn to inform aldryn client about the errors in
            // SASS compilation
            if (process.env.EXIT_ON_ERRORS) {
                process.exit(1);
            }
        })
        .pipe(autoprefixer({
            // browsers are coming from browserslist file
            cascade: false
        }))
        .pipe(minifyCss())
        // sourcemaps can be activated through `gulp sass --debug´
        .pipe(gulpif(DEBUG, sourcemaps.write()))
        .pipe(gulp.dest(PROJECT_PATH.css))
);

gulp.task('images', () => {
    const options = {
        interlaced: true,
        optimizationLevel: 5,
        progressive: true,
    };

    return gulp.src(PROJECT_PATTERNS.images)
        .pipe(cache(imagemin(options)))
        .pipe(gulp.dest(PROJECT_PATH.images)).on('error', function (error) {
            gutil.log(`\n${error.message}`);
        });
});

gulp.task('docs', () =>
    gulp.src(PROJECT_PATTERNS.js)
        .pipe(yuidoc())
        .pipe(gulp.dest(PROJECT_PATH.docs))
);

gulp.task('icons', () =>
    gulp.src(`${PROJECT_PATH.icons}/**/*.svg`)
        .pipe(iconfontCss({
            fontName: 'iconfont',
            appendUnicode: true,
            formats: ['ttf', 'eot', 'woff', 'svg'],
            fontPath: 'static/fonts/',
            path: PROJECT_PATH.sass + '/libs/_iconfont.scss',
            targetPath: '../../../private/sass/layout/_iconography.scss',
        }))
        .pipe(iconfont({
            fontName: 'iconfont',
            normalize: true,
        }))
        .on('glyphs', function (glyphs, options) {
            gutil.log.bind(glyphs, options);
        })
        .pipe(gulp.dest(PROJECT_PATH.fonts))
);

gulp.task('bower', () => bower(gulp.dest(PROJECT_ROOT + PROJECT_PATH.bower)));

// #############################################################################
// SERVICES
gulp.task('browser', () => {
    const files = [
        `${PROJECT_PATH.css}*.css`,
        `${PROJECT_PATH.html}**/*.html`,
        `${PROJECT_PATH.js}**/*.js`,
    ];

    // DOCS: http://www.browsersync.io/docs/options/
    setTimeout(() => {
        browserSync.init(files, {
            proxy: `0.0.0.0:${PORT}`,
            port: PORT + 1,
            ui: {
                port: PORT + 2,
            },
        });
    }, 1000);
});

// #############################################################################
// TESTS
gulp.task('tests', ['tests:unit', 'tests:integration', 'tests:lint']);
gulp.task('tests:unit', (done) => {
    // run javascript tests
    karma.start({
        configFile: `${PROJECT_PATH.tests}/karma.conf.js`,
        singleRun: true,
    }, done);
});

gulp.task('tests:webdriver', webdriverUpdate);
gulp.task('tests:integration', ['tests:webdriver'], () =>
    gulp.src(`${PROJECT_PATH.tests}/integration/specs/*.js`)
        .pipe(protractor({
            configFile: `${PROJECT_PATH.tests}/protractor.conf.js`,
            args: [],
        }))
        .on('error', function (error) {
            gutil.log(gutil.colors.red(
                `Error (${error.plugin}): ${error.message}`
            ));
        })
);

gulp.task('tests:lint', ['lint']);

gulp.task('tests:watch', ['tests:lint'], () => {
    // run javascript tests
    karma.start({
        configFile: PROJECT_PATH.tests + '/karma.conf.js'
    });
});

// #############################################################################
// COMMANDS
gulp.task('watch', () => {
    gulp.watch(PROJECT_PATTERNS.sass, ['sass']);
    gulp.watch(PROJECT_PATTERNS.js, ['lint']);
});

gulp.task('default', ['bower', 'sass', 'lint', 'watch']);
