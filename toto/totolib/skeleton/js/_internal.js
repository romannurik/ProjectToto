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

var context = require('./_context.js');

var totoInternal = {};

totoInternal.init = function(rootNode, options) {
  options = options || {};
  options.width = options.width || 360;
  options.height = options.height || 640;
  options.title = options.title || 'Untitled Prototype';

  context.screens = {};
  context.prototypeTitle = options.title;
  context.currentScreen = null;

  context.$root = $(rootNode)
      .empty()
      .css({
        width: options.width,
        height: options.height
      });
};

totoInternal.loadScreenFromHash = function() {
  var defaultScreenName = context.defaultScreenName;
  if (!defaultScreenName) {
    for (var k in context.screens) {
      defaultScreenName = context.screens[k].name;
      break;
    }
  }

  var nameAndArg = document.location.hash.replace(/^#/, '');
  if (!nameAndArg) {
    nameAndArg = defaultScreenName;
  }

  nameAndArg = nameAndArg.split(/:/);
  var name = nameAndArg[0];
  var arg = nameAndArg.length > 1 ? nameAndArg[1] : null;

  totoInternal.showScreen(name, {arg});
};

totoInternal.showScreen = function(name, options) {
  var newScreen = context.screens[name];
  if (!newScreen) {
    console.error(`No screen with name ${name}`);
    newScreen = context.screens;
    if (context.defaultScreenName) {
      newScreen = context.screens[context.defaultScreenName];
    } else {
      for (var n in context.screens) {
        newScreen = context.screens[n];
        break;
      }
    }
  }
  if (newScreen == context.currentScreen) {
    return;
  }

  options = options || {};

  runListeners_(newScreen.preShowListeners, [options.arg]);

  var i = 0;
  var nextCallback_ = function() {
    if (i >= context.screenTransitionCallbacks.length) {
      done_();
      return;
    }

    context.screenTransitionCallbacks[i](context.currentScreen, newScreen, options, function() {
      ++i;
      nextCallback_();
    });
  };

  var done_ = () => runListeners_(newScreen.showListeners, [options.arg]);

  nextCallback_();

  $('toto-screen').removeClass('current');
  context.currentScreen = newScreen;
  newScreen.$root.addClass('current');
  var newHash = '#' + encodeURIComponent(name);
  if (options.arg) {
    newHash += ':' + encodeURIComponent(options.arg);
  }
  if (history.replaceState) {
    history.replaceState({}, '', newHash);
  } else {
    document.location.hash = newHash;
  }
}

totoInternal.rescale = function() {
  var $root = $('.proto-root');
  var $window = $(window);

  var ow = $root.width();
  var oh = $root.height();

  var ww = $window.width();
  var wh = $window.height();

  var scale = 1;

  if (ow / oh > ww / wh) {
    scale = ww / ow;
  } else {
    scale = wh / oh;
  }

  scale *= 0.9;
  scale = Math.min(scale, 1);

  $root.css('transform', `scale(${scale}) translateZ(0)`);
};

function runListeners_(arr, args) {
  (arr || []).forEach(listener => listener.apply(null, args || []));
}

module.exports = totoInternal;