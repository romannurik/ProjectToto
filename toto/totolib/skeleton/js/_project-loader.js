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

var {toto, TotoScreen} = require('./_api.js');

var totoProjectLoader = {};

totoProjectLoader.import = function(metaPath, projectScripts) {
  projectScripts = projectScripts || [];

  $.when(
      $.ajax({url: metaPath, dataType: 'json'})
    )
    .done(function(meta) {
      loadProject_(meta);
      var getScriptPromises = projectScripts
          .filter(function(x){ return !!x; })
          .map(function(s){ return $.ajax({url:s, dataType:'text'}); });
      $.when.apply(null, getScriptPromises)
          .done(function() {
            for (var i = 0; i < projectScripts.length; i++) {
              var screenName = projectScripts[i].replace(/.js/, '').replace(/.*\//, '');
              var scriptContents = projectScripts.length == 1 ? arguments[0] : arguments[i][0];

              scriptContents = `
var ___SCREEN___ = toto.getScreen('${screenName}');
if (!___SCREEN___) { ___SCREEN___ = toto.newScreen('${screenName}'); }
(function(screen, $) {
${scriptContents}
})(___SCREEN___, ___SCREEN___.$.bind(___SCREEN___));
`;
              $.globalEval(scriptContents);
            }

            totoInternal.loadScreenFromHash();
          })
          .fail(function(jqxhr, settings, exception) {
            console.error(exception);
          });
    });
};

function loadProject_(meta) {
  context.prototypeTitle = meta.title;
  context.defaultScreenName = meta.defaultScreen;
  if ('showHotspotsOnClick' in meta) {
    context.showHotspotsOnClick = !!meta.showHotspotsOnClick;
  }
  context.screens = {};
  context.$root
      .empty()
      .css({
        width: meta.screenResolution[0].toFixed(0),
        height: meta.screenResolution[1].toFixed(0)
      });

  totoInternal.rescale();

  var screenMetasByName = [];
  meta.screens.forEach(screenMeta => screenMetasByName[screenMeta.name] = screenMeta);
  meta.screens.forEach(screenMeta => loadScreen_(screenMeta, screenMetasByName));

  context.rebuildCallbacks.forEach(callback => callback());
}

function loadScreen_(screenMeta, includeMetas) {
  var screen = toto.newScreen(screenMeta.name);
  screen.annotations = screenMeta.annotations;

  if (screenMeta.annotations && screenMeta.annotations.default) {
    context.defaultScreenName = screenMeta.name;
  }

  // build layer tree, starting with includes

  if (screenMeta.annotations && screenMeta.annotations.include) {
    var includes = screenMeta.annotations.include;
    if (!Array.isArray(includes)) {
      includes = [includes];
    }

    includes.forEach(includeName =>
        loadLayer_({
          meta: includeMetas[includeName],
          screen,
          sourceScreenName: includeName,
          parent: screen.$root,
          root: true
        }));
  }

  loadLayer_({
    meta: screenMeta,
    screen,
    parent: screen.$root,
    root: true
  });
}

function loadLayer_(options) {
  var layerMeta = options.meta;
  var screen = options.screen;
  var offset = options.offset || { x: 0, y: 0 };
  var sourceScreenName = options.sourceScreenName || options.screen.name;
  var root = !!options.root;
  var $parent = options.parent;

  layerMeta.annotations = layerMeta.annotations || {};
  layerMeta.stylingMargins = layerMeta.stylingMargins || {};

  var $layer = screen.newLayer(layerMeta.name)
      .css({
        left: (layerMeta.x + (layerMeta.stylingMargins.l || 0)),
        top: (layerMeta.y + (layerMeta.stylingMargins.t || 0)),
        width: layerMeta.w,
        height: layerMeta.h,
        marginLeft: (-(layerMeta.stylingMargins.l || 0) + offset.x), // put the offset (from parent) in the margin so left/top properties are easy to work with
        marginTop: (-(layerMeta.stylingMargins.t || 0) + offset.y),
        paddingLeft: (layerMeta.stylingMargins.l || 0),
        paddingTop: (layerMeta.stylingMargins.t || 0),
        paddingRight: (layerMeta.stylingMargins.r || 0),
        paddingBottom: (layerMeta.stylingMargins.b || 0),
        opacity: (layerMeta.opacity !== undefined ? layerMeta.opacity : 1)
      })
      .appendTo($parent);

  if (!layerMeta.annotations.visible && (layerMeta.hidden || layerMeta.annotations.hidden)) {
    $layer.addClass('hidden');
  }

  if (layerMeta.image) {
    var random = '';//'?cachebust=' + Math.floor(Math.random() * 1000000);
    $layer
        .addClass('has-image')
        .css({
          'background-image': `url("screens/${sourceScreenName}/${layerMeta.image}.png${random}")`
        });
  }

  layerMeta.layers = layerMeta.layers || [];

  if (options.root) {
    layerMeta.layers.forEach(subLayer =>
        loadLayer_({
          meta: subLayer,
          screen,
          sourceScreenName,
          parent: $parent
        }));

    // convert artboard root layer to background layer, move it to the end
    $layer.name(layerMeta.name + '_Background').appendTo($parent);

  } else if (layerMeta.layers.length) {
    layerMeta.layers.forEach(subLayer =>
        loadLayer_({
          meta: subLayer,
          offset: { x: (layerMeta.stylingMargins.l || 0), y: (layerMeta.stylingMargins.t || 0) },
          screen,
          sourceScreenName,
          parent: $layer
        }));
  }

  context.loadLayerCallbacks.forEach(callback => callback(layerMeta, $layer, screen));
}

module.exports = totoProjectLoader;