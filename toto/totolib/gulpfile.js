/*
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var argv = require('yargs').argv;
var del = require('del');
var fs = require('fs');
var path = require('path');
var process = require('process');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var merge = require('merge-stream');
var babelPresetEs2015 = require('babel-preset-es2015');

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

// ensure we're in the 'toto-prototype' folder (it might not exist).
var projectRoot = argv.projectRoot;
if (path.basename(projectRoot) != 'toto-prototype') {
  projectRoot += '/toto-prototype';
}

var distPath = projectRoot + '/build';
var sketchExportPath = distPath + '/screens';

// packaged mode
var packagedMode = !!argv.packagedMode;

function log(s) {
  if (!packagedMode) {
    $.util.log(s);
  }
}

function outputPackagedModeItem(k, v) {
  if (packagedMode) {
    console.log(k + ':' + v);
  }
}

gulp.on('task_err', function(err) {
  console.error(err);
  outputPackagedModeItem('status', 'error');
  process.exit();
});

function errorHandler(error) {
  console.error(error);
  this.emit('end'); // http://stackoverflow.com/questions/23971388
}

// globals
var buildUgly = false;

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 2',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

log('Welcome to toto!');

// Template for sass'ing streams
function sassStream(stream) {
  stream = stream
    .pipe($.sass({
        style: 'expanded',
        precision: 10,
        quiet: true
      }).on('error', errorHandler))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS));
  if (buildUgly) {
    stream = stream.pipe($.csso());
  }
  return stream;
}

function jsStream(stream) {
  stream = stream.pipe(
    $.babel({
      presets: [babelPresetEs2015]
    })
    .on('error', errorHandler));
  if (buildUgly) {
    stream = stream.pipe($.uglify({preserveComments: 'some'}));
  }
  return stream;
}

gulp.task('prepare', function (cb) {
  // TODO: any necessary prep steps here
  cb();
});

// copy prototype JS files
gulp.task('merge-project-js-files', function () {
  del.sync([distPath + '/screens/*.js'], {force:true});
  return jsStream(gulp.src(projectRoot + '/*.js'))
      .pipe(gulp.dest(distPath + '/screens'));
});

// process and merge in skeleton files
gulp.task('merge-skeleton-assets', function () {
  var streams = [];

  // process and copy plugin assets
  streams.push(sassStream(gulp.src([
      'skeleton/plugins/**/*.scss',
      'skeleton/plugins/**/*.css',
      '!skeleton/plugins/**/_*.scss',
      '!skeleton/plugins/**/_*.css'
    ]))
    .pipe(gulp.dest(distPath + '/plugins')));

  streams.push(
    jsStream(gulp.src('skeleton/plugins/**/*.js'))
    .pipe(gulp.dest(distPath + '/plugins')));

  // process and copy skeleton assets
  streams.push(gulp.src('skeleton/images/**')
    .pipe(gulp.dest(distPath + '/images')));

  streams.push(gulp.src('skeleton/lib/**')
    .pipe(gulp.dest(distPath + '/lib')));

  streams.push(
    jsStream(gulp.src('skeleton/js/toto.js')
    .pipe($.webpack({
      output: {
        filename: 'toto.js',
      },
    }, null, function(err, stats) {
      // suppress stats
      if (err) {
        throw new $.util.PluginError('webpack', err);
      }
    })))
    .pipe(gulp.dest(distPath + '/js')));

  streams.push(sassStream(gulp.src([
      'skeleton/css/**/*.scss',
      'skeleton/css/**/*.css',
      '!skeleton/css/**/_*.scss',
      '!skeleton/css/**/_*.css'
    ]))
    .pipe(gulp.dest(distPath + '/css')));

  return merge(streams);
});

// copy sketch export stuff
gulp.task('generate-prototype-json', function (cb) {
  // merge meta JSON + screen JSONs
  var metaStr;
  var meta = {
    title: 'Untitled Prototype',
    screenResolution: [360,640],
    thumbnail: null
  };

  if (fs.existsSync(sketchExportPath + '/prototype_auto_preamble.json')) {
    metaStr = fs.readFileSync(sketchExportPath + '/prototype_auto_preamble.json');
    meta = Object.assign(meta, JSON.parse(metaStr || '{}'));
  }

  if (fs.existsSync(projectRoot + '/prototype.json')) {
    metaStr = fs.readFileSync(projectRoot + '/prototype.json');
    meta = Object.assign(meta, JSON.parse(metaStr || '{}'));
  }

  outputPackagedModeItem('proto_path', projectRoot);
  outputPackagedModeItem('title', meta.title);
  if (meta.thumbnail) {
    outputPackagedModeItem('thumbnail', meta.thumbnail);
  }

  // merge in JSON for each screen
  meta.screens = [];
  if (fs.existsSync(sketchExportPath)) {
    fs.readdirSync(sketchExportPath).forEach(function(screen) {
      var stat = fs.statSync(sketchExportPath + '/' + screen);
      if (stat.isDirectory()) {
        var screenMetaStr = fs.readFileSync(sketchExportPath + '/' + screen + '/prototype_screen.json');
        var screenMeta = JSON.parse(screenMetaStr || '{}') || {};
        meta.screens.push(screenMeta);
      }
    });
  }

  fs.writeFileSync(distPath + '/prototype.json', JSON.stringify(meta, null, 2));
  cb();
});

gulp.task('html', ['prepare', 'merge-project-js-files', 'plugin-assets'], function () {
  var stream = gulp.src('skeleton/index.html')
    .pipe($.inject(
      gulp.src('screens/*.js', {cwd: distPath, read: false}), {
        addRootSlash: false,
        starttag: '// begin:project-js',
        endtag: '// end:project-js',
        quiet: true,
        transform: function(filepath, file, index, length, targetFile) {
          return '"' + filepath + '",';
        }
      }))
    .pipe($.inject(
      gulp.src(['plugins/**/*.js'], {cwd: distPath, read: false}), {
        addRootSlash: false,
        starttag: '<!-- begin:plugin-js -->',
        endtag: '<!-- end:plugin-js -->',
        quiet: true,
        transform: function(filepath, file, index, length, targetFile) {
          return '<script src="' + filepath + '"></script>';
        }
      }))
    .pipe($.inject(
      gulp.src(['plugins/**/*.css'], {cwd: distPath, read: false}), {
        addRootSlash: false,
        starttag: '<!-- begin:plugin-css -->',
        endtag: '<!-- end:plugin-css -->',
        quiet: true,
        transform: function(filepath, file, index, length, targetFile) {
          return '<link href="' + filepath + '" rel="stylesheet">';
        }
      }));
  if (buildUgly) {
    stream = stream.pipe($.minifyHtml());
  }
  return stream.pipe(gulp.dest(distPath));
});

gulp.task('plugin-assets', ['prepare'], function () {
  var streams = [];

  // load list of local plugins
  var localPlugins = [];
  if (fs.existsSync(projectRoot + '/plugins')) {
    fs.readdirSync(projectRoot + '/plugins').forEach(function(plugin) {
      var stat = fs.statSync(projectRoot + '/plugins/' + plugin);
      if (stat.isDirectory()) {
        localPlugins.push(plugin);
      }
    });
  }

  localPlugins.forEach(function(plugin) {
    del.sync([distPath + '/plugins/' + plugin], {force:true});
    streams.push(sassStream(gulp.src([
        projectRoot + '/plugins/' + plugin + '/*.scss',
        projectRoot + '/plugins/' + plugin + '/*.css',
      ]))
      .pipe(gulp.dest(distPath + '/plugins/' + plugin)));

    streams.push(jsStream(gulp.src(projectRoot + '/plugins/' + plugin + '/*.js'))
      .pipe(gulp.dest(distPath + '/plugins/' + plugin)));
  });

  if (streams.length) {
    return merge(streams);
  }
});

// clean output directory
gulp.task('clean', function(cb) {
  $.cache.clearAll();
  del.sync(['*', '!screens'], {cwd:distPath, force:true});
  cb();
});

// watch files for changes & reload
gulp.task('serve', ['_build'], function () {
  var bs = browserSync.create();

  bs.init({
    ui: false,
    notify: false,
    logPrefix: 'BrowserSync',
    logLevel: 'silent',
    open: !packagedMode,
    server: {
      baseDir: [
        distPath
      ]
    }
  });

  bs.emitter.on('init', function(data) {
    var urlsMap = data.getOptions().get('urls');
    log('Local URL: ' + urlsMap.get('local'));
    log('External URL: ' + urlsMap.get('external'));
    outputPackagedModeItem('local_url', urlsMap.get('local'));
    outputPackagedModeItem('external_url', urlsMap.get('external'));
    outputPackagedModeItem('status', 'running');
  });

  var opts = {};
  gulp.watch(['skeleton/**/*.{scss,css,js}'], opts, ['merge-skeleton-assets', bs.reload]);
  gulp.watch(['skeleton/**/*.html'], opts, ['html', bs.reload]);
  gulp.watch([projectRoot + '/plugins/**/*.{scss,css,js}'], opts, ['html', bs.reload]);
  gulp.watch([projectRoot + '/*.js'], opts, ['html', bs.reload]);

  // Only listen to meta.json to prevent this running multiple times during export
  gulp.watch([
    sketchExportPath + '/.exportcomplete',
    projectRoot + '/prototype.json',
  ]).on('change', function(event) {
    runSequence('generate-prototype-json', 'html', bs.reload);
  });

  log('Serving your prototype and watching for file changes. Press Cancel to stop.');
});

gulp.task('_build', ['clean'], function (cb) {
  runSequence(
      'prepare',
      'merge-skeleton-assets',
      'plugin-assets',
      ['generate-prototype-json', 'merge-project-js-files'],
      'html',
      cb);
});

gulp.task('build', function(cb) {
  buildUgly = true;
  runSequence('_build', function() {
    log('Built prototype in ' + distPath);
    cb();
  });
});

gulp.task('init', function (cb) {
  var stream1 = gulp.src('init_template/**/*.sketch').pipe(gulp.dest(projectRoot + '/..'));
  var stream2 = gulp.src('init_template/toto-prototype/**').pipe(gulp.dest(projectRoot));
  log('Initialized a new template in folder ' + projectRoot);
  return merge(stream1, stream2);
});

gulp.task('default', ['serve']);