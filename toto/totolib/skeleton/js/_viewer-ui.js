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


$(document)
  .ready(function() {
    FastClick.attach(document.body);

    setupFullscreen();
    setupIOSBodyOverscrollFix();
    setupWindowTitleUpdater();

    totoInternal.rescale();
  })
  .click(function() {
    if (!context.showHotspotsOnClick) {
      return;
    }

    if (context.consumeNextShowHotspots) {
      context.consumeNextShowHotspots = false;
      return;
    }
    $('body').addClass('show-targets');
    setTimeout(() => $('body').removeClass('show-targets'), 800);
  });


$(window)
    .on('resize', totoInternal.rescale)
    .on('hashchange', function(ev) {
      totoInternal.loadScreenFromHash();
      return false;
    });

function setupFullscreen() {
  if (window.navigator.standalone) {
    $('body').addClass('isfullscreen');
    return;
  }

  var rfsElement = document.documentElement;
  var rfs = rfsElement.webkitRequestFullscreen || rfsElement.requestFullscreen;

  if (!rfs || ('standalone' in window.navigator && window.navigator.standalone)) {
    $('.fullscreen-button').addClass('hidden');
  }

  $(document).click(function() {
    $('.fullscreen-button').addClass('hidden');
  });

  $('.fullscreen-button').click(function() {
    context.consumeNextShowHotspots = true;
    rfs.call(rfsElement);
    return false;
  });

  $(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange', function() {
    $('body').toggleClass('isfullscreen',
        document.fullScreenElement || document.webkitFullScreenElement || document.mozFullScreenElement);
  });
}

function setupIOSBodyOverscrollFix() {
  var scrollFixSkipSelector = '.scroll-vertical, .scroll-horizontal, .scroll';

  $(document)
      .on('touchmove', function(ev) {
        if (!$(ev.target).is(scrollFixSkipSelector)) {
          ev.preventDefault();
        }
      })
      .on('touchmove', scrollFixSkipSelector, function(ev) {
        var t = ev.target;
        var scrollMax = t.scrollHeight - parseInt(t.style.height, 10);
        if (t.scrollTop == 0) {
          t.scrollTop = 1;
        } else if (t.scrollTop == scrollMax) {
          t.scrollTop = scrollMax - 1;
        }
      });
}

function setupWindowTitleUpdater() {
  context.screenTransitionCallbacks.push(function(currentScreen, newScreen, options, callback) {
    document.title = (context.prototypeTitle ? (context.prototypeTitle + ': ') : '')
        + newScreen.name + ' (Toto Prototype)';
    callback();
  });
}

// Black-on-transparent status bar for iOS

// $(document).ready(function() {
//   (function(){
//     if (!window.navigator.standalone) {
//       var meta = document.createElement("meta");
//       meta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
//       meta.setAttribute("content", "black-translucent");
//       var head = document.getElementsByTagName("head")[0];
//       head.appendChild(meta);
//     }
//   }());
// });

// function _debug(f) {
//   $('#foo').remove();
//   $('<div id="foo" style="position:fixed;right:0;bottom:0;color:white">')
//       .text(f)
//       .appendTo('body');
// }