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

var HOTSPOT_ANNOTATIONS = {
  'navigate': true,
  'show': true,
  'hide': true,
};

toto.onLoadLayer(function(layerData, $layer, screen) {
  for (var annotation in layerData.annotations) {
    if (annotation in HOTSPOT_ANNOTATIONS) {
      var action = annotation;
      var target = layerData.annotations[annotation];

      var $hotspotLayer = screen.$('#' + layerData.name);

      (function(target) {
        switch (action) {
          case 'navigate':
            var options = {};
            var targetAndArg = target.split(/:/);
            var target = targetAndArg[0];
            var arg = targetAndArg.length > 1 ? targetAndArg[1] : null;
            $hotspotLayer.hotspot(function() {
              if (screen.defaultSharedElements) {
                options = {
                  sharedElements: screen.defaultSharedElements,
                  arg: arg
                };
              }
              toto.getScreen(target).show(options);
            });
            break;

          case 'show':
            $hotspotLayer.hotspot(function() {
              target.split(/,/).forEach(function(t) {
                screen.$('#' + t).show();
              });
            });
            break;

          case 'hide':
            $hotspotLayer.hotspot(function() {
              target.split(/,/).forEach(function(t) {
                screen.$('#' + t).hide();
              });
            });
            break;
        }
      })(target);
    }

  }
});

$.fn.hotspot = function(fn) {
  return this
    .addClass('hotspot')
    .click(function() {
    if (fn) {
      fn.apply(this, arguments);
    }

    toto.consumeNextShowHotspots();
  });
};

})();