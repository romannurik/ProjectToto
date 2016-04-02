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

function shouldExportLayer(layer) {
  parseLayerName(layer);
  var hasAnnotations = false;
  for (var k in layer._annotations || {}) {
    hasAnnotations = true;
    break;
  }
  return (isGroup(layer) || layer._forceOwnImage || layer.closestClippingLayer() != null || hasAnnotations) && !layer._ignore;
}

/**
 * Sets layer data like _realName, _annotations, _ignore, etc.
 */
function parseLayerName(layer) {
  var name = layer.name();
  if (layer._lastParsedName == name) {
    return;
  }

  layer._lastParsedName = name;

  var name = strip(name);

  layer._ignore = false;
  layer._flattenAllChildren = false;
  layer._forceOwnImage = false;

  var startChar = name.charAt(0);
  switch (startChar) {
    case '*':
      layer._flattenAllChildren = true;
      name = name.substring(1);
      break;
    case '-':
      layer._ignore = true;
      name = name.substring(1);
      break;
    case '+':
      layer._forceOwnImage = true;
      name = name.substring(1);
      break;
  }

  var matches = name.match(/![^\s]+/g) || [];
  layer._annotations = {};
  if (matches.length > 0) {
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i].match(/!(\w+)(?:\:([^\s]+))?/);
      if (!m) {
        continue;
      }

      var key = m[1];
      var value = m[2];
      if (value === undefined) {
        value = true;
      }

      if (layer._annotations[key]) {
        if (!Array.isArray(layer._annotations[key])) {
          layer._annotations[key] = [layer._annotations[key]];
        }

        layer._annotations[key].push(value);
      } else {
        layer._annotations[key] = value;
      }
    }
  }

  layer._realName = strip(name.replace(/![^\s]+/g, '').replace(/\s+/g, ' '));
}

/**
 * Sets the layer name based on its annotations.
 */
function updateParsedLayerName(layer) {
  if (!layer._lastParsedName) {
    return;
  }

  var name = '';
  if (layer._ignore) {
    name = '-';
  } else if (layer._flattenAllChildren) {
    name = '*';
  } else if (layer._forceOwnImage) {
    name = '+';
  }

  name += layer._realName;

  for (var k in (layer._annotations || {})) {
    var vals = layer._annotations[k];
    if (!Array.isArray(vals)) {
      vals = [vals];
    }

    vals.forEach(function(val) {
      if (val !== undefined && val !== null) {
        name += ' !' + k + ((val === true) ? '' : (':' + val));
      }
    });
  }

  layer.setName(name);
}

/**
 * Create a unique key for the layer based on its name.
 */
function makeLayerKey(layer, artboardName) {
  makeLayerKey._keysForArtboard = makeLayerKey._keysForArtboard || {};

  parseLayerName(layer);

  artboardName = artboardName || '';
  makeLayerKey._keysForArtboard[artboardName] = makeLayerKey._keysForArtboard[artboardName] || {};
  var layerKeys = makeLayerKey._keysForArtboard[artboardName];

  // create layer key
  var rootKey = sanitizeId(layer._realName);
  var key = rootKey;
  var number = 1;

  while (key.toLowerCase() in layerKeys) {
    key = rootKey + '_' + number;
    ++number;
  }

  layer._key = key;
  layerKeys[key.toLowerCase()] = 1;
  return key;
}

/**
 * Reset layer keys for the given artboard.
 */
function clearLayerKeys(artboardName) {
  makeLayerKey._keysForArtboard[artboardName] = {};
}

/**
 * Run through all exportable layes in an artboard and return a map from their key to the layer.
 */
function markAndIdentifyExportableLayersForArtboard(artboard, callback) {
  parseLayerName(artboard);

  var exportableLayers = {};
  walkLayerTree(artboard, function(layer, iter) {
    if (!shouldExportLayer(layer)) {
      iter.finishLayer();
      return;
    }

    makeLayerKey(layer, artboard._realName);
    exportableLayers[layer._key] = layer;

    if (isGroup(layer) && !layer._flattenAllChildren && !isSymbol(layer)) {
      iter.walkChildren(iter.finishLayer);
    } else {
      iter.finishLayer();
    }

  }, function() {
    callback(exportableLayers);
  });
}