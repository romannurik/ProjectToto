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
var totoInternal = require('./_internal.js');

var toto = {};

toto.init = totoInternal.init;

toto.newScreen = function(screenName) {
  var screen = new TotoScreen();
  screen.name = screenName;
  screen.$root = $('<toto-screen>')
      .name(screen.name)
      .appendTo(context.$root);
  context.screens[screen.name] = screen;
  return screen;
};

toto.getScreen = function(screenName) {
  return context.screens[screenName];
};

toto.onLoadLayer = function(fn) {
  context.loadLayerCallbacks.push(fn);
};

toto.onRebuild = function(fn) {
  context.rebuildCallbacks.push(fn);
};

toto.onScreenTransition = function(fn) {
  context.screenTransitionCallbacks.push(fn);
};

toto.consumeNextShowHotspots = function() {
  context.consumeNextShowHotspots = true;
}

Object.defineProperty(toto, 'currentScreen', {
  get: function() {
    return context.currentScreen;
  }
});

var TotoScreen = function() {
  this.preShowListeners = [];
  this.showListeners = [];
};

TotoScreen.prototype.$ = $.extend(function(a, b) {
  // TODO: better detection of $('<foo>') form
  if (typeof a === 'string' && a.charAt(0) != '<') {
    if (b !== undefined) {
      return this.$root.find(b).find(a);
    } else {
      return this.$root.find(a);
    }
  } else {
    return jQuery.call(null, arguments);
  }
}, jQuery);

TotoScreen.prototype.show = function(options) {
  totoInternal.showScreen(this.name, options);
};

TotoScreen.prototype.onPreShow = function(listener) {
  this.preShowListeners.push(listener);
};

TotoScreen.prototype.onShow = function(listener) {
  this.showListeners.push(listener);
};

TotoScreen.prototype.newLayer = function(layerName, options) {
  var $layer = $('<toto-layer>').prependTo(this.$root);
  if (layerName) {
    $layer.name(layerName);
  }
  return $layer;
};

Object.defineProperty(TotoScreen.prototype, 'width', {
  get: function() { return this.$root.width(); }
});

Object.defineProperty(TotoScreen.prototype, 'height', {
  get: function() { return this.$root.height(); }
});

module.exports = {TotoScreen, toto};