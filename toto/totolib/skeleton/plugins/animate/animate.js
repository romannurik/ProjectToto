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

(function() {

var $overlayScreen;


toto.onLoadLayer(function(layerData, $layer, screen) {
  if (layerData.annotations.animation) {
    $layer.addClass('animate-' + layerData.annotations.animation);
  }
});


toto.onRebuild(function() {
  $overlayScreen = $('<toto-screen>')
      .addClass('overlay')
      .appendTo($('.proto-root'));
  $overlayScreen.hide();
});


toto.onScreenTransition(function(currentScreen, newScreen, options, callback) {
  $('toto-screen').addClass('transition-fade'); // default for all transitions

  if (options.sharedElements) {
    $overlayScreen.empty();
    if (typeof options.sharedElements === 'string') {
      options.sharedElements = [options.sharedElements];
    }
    var first = true;
    $overlayScreen.show();
    options.sharedElements.forEach(function(se) {
      var a = se.split(':');
      var fromId = a[0];
      var toId = (a.length >= 2) ? a[1] : a[0];
      performSharedElementTransition_(
          currentScreen, newScreen,
          fromId, toId, first ? callback : null);
      first = !first;
    });
  } else {
    callback();
  }
});


function performSharedElementTransition_(fromScreen, toScreen, fromLayerName, toLayerName, callback) {
  callback = callback || function(){};

  var $fromScreen = fromScreen.$root;
  var $toScreen = toScreen.$root;

  var $fromEl = fromScreen.$('#' + fromLayerName);
  var $toEl = toScreen.$('#' + toLayerName);

  if (!$fromEl.length || !$toEl.length) {
    console.warn(`A shared element transition from layer ${fromLayerName}`
        + ` to ${toLayerName} was not performed because either the `
        + 'source or target layer was missing.');
    callback();
    return;
  }

  // there are two transition elements, and we cross-fade between them... the first one
  // is the image of the source layer, the second is the image of the target layer
  var $transitionElStart = $fromEl.clone()
      .appendTo($overlayScreen);
  var $transitionElEnd = $toEl.clone()
      .appendTo($overlayScreen);
  var $transitionEls = $([$transitionElStart.get(0), $transitionElEnd.get(0)]);

  var fromPosition = $fromEl.positionInScreen();
  var toPosition = $toEl.positionInScreen();

  $transitionEls.css({
    left: fromPosition.left,
    top: fromPosition.top,
    marginLeft: -parseInt($fromEl.css('padding-left'), 10),
    marginTop: -parseInt($fromEl.css('padding-top'), 10),
    transformOrigin: '0% 0%',
    transform: 'translate3d(0,0,0)',
    opacity: 1
  });

  var scaleX = $fromEl.width() / $toEl.width();
  var scaleY = $fromEl.height() / $toEl.height();
  $transitionElEnd.css({
    transform: 'scale(' + scaleX + ',' + scaleY + ')',
    opacity: 0
  });

  var translateX = toPosition.left - fromPosition.left;
  var translateY = toPosition.top - fromPosition.top;
  var scaleX = $toEl.width() / $fromEl.width();
  var scaleY = $toEl.height() / $fromEl.height();
  
  $fromEl.hide();
  $toEl.hide();

  $transitionEls.addClass('tween');
  $transitionElStart.on('transitionend', function() {
    $overlayScreen.hide();
    $transitionEls.remove();
    $fromEl.show();
    $toEl.show();
    callback();
  });

  setTimeout(function() {
    $transitionEls.css({
      marginLeft: -parseInt($toEl.css('padding-left'), 10),
      marginTop: -parseInt($toEl.css('padding-top'), 10)
    });
    $transitionElStart.css({
      transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
      opacity: 0,
    });
    $transitionElEnd.css({
      transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(1)`,
      opacity: 1,
    });
  }, 0);
}

})();