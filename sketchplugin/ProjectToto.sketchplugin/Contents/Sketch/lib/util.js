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

////////////////////////////////////////////////////////////////////////////////////////////////////
// General helpers

function ensureApiVersion(context) { 
  var appVersion = [NSApp applicationVersion].substr(0,1);
  if (appVersion < 3) {
    context.document.showMessage('Plugin only supports Sketch 3 and above. You are running '
        + appVersion + '. Please upgrade Sketch.');
    return false;
  }

  return true;
}

function showMessage(context, msg) {
  context.document.showMessage(msg);
}

function showMessageAndLog(context, msg) {
  showMessage(context, msg);
  log(msg);
}

function showMessageDialog(msg, title){
  var app = NSApplication.sharedApplication();
  app.displayDialog_withTitle_(repr(msg), repr(title));
}

function writeJSONObject(filePath, object) {
  // var jsonContents = NSJSONSerialization.dataWithJSONObject_options_error_(object, NSJSONWritingPrettyPrinted, null);
  // jsonContents = NSString.alloc().initWithData_encoding_(jsonContents, NSUTF8StringEncoding);
  var jsonContents = JSON.stringify(object, null, 2); // better formatting than NSJSONSerialization
  writeString(filePath, jsonContents);
}

function writeString(filePath, s) {
  s = NSString.stringWithFormat('%@', s);
  s.writeToFile_atomically_encoding_error_(filePath, true, NSUTF8StringEncoding, null);
}

function extend(obj, obj2) {
  for (var k in obj2) {
    obj[k] = obj2[k];
  }
  return obj;
}

function sanitizeId(name) {
  return name
      .replace(/[^\w]+/g, '_')
      .replace(/^_+/g, '')
      .replace(/_+$/g, '');
}

function strip(s) {
  return s
      .replace(/^\s+/g, '')
      .replace(/\s+$/g, '');
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Debugging

function profileFunction(fn) {
  return function() {
    var start = Number(new Date());
    var retVal = fn.apply(this, arguments);
    var time = (Number(new Date()) - start);
    var args = Array.prototype.slice.call(arguments);
    log(fn.name + ': ' + time + 'ms, args:(' + args.map(function(x){ return x.toString() }).join(', ') + ')');
    return retVal;
  };
}

function logIndented(message, depth, spacer) {
  spacer = spacer || '>';
  var padding = spacer;
  for(var i = 0; i < depth; i++) {
    padding = padding + spacer;
  }
  log(padding + " " + message);
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Flow helpers

// unpeg CPU using a setTimeout equivalent
function unpeg(fn) {
  coscript.scheduleWithInterval_jsFunction_(0, fn);
}

function wrapInUnpeg(fn) {
  return function() {
    var args = arguments;
    unpeg(function() {
      fn.apply(null, args);
    });
  };
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Async flow helpers

function asyncIterate(arr, visitFunction, callback) {
  var i = 0;

  iter = {
    next: function() {
      ++i;
      if (i < arr.length) {
        visitNext_();
      } else {
        callback();
      }
    }
  };

  function visitNext_() {
    visitFunction(iter, arr[i], i);
  }

  if (i < arr.length) {
    visitNext_();
  }
}

function runSequence() {
  var sharedContext = {};

  var args = arguments;
  var i = 0;

  function visit_() {
    args[i](runNext_, sharedContext);
  }

  function runNext_() {
    ++i;
    if (i < args.length) {
      visit_();
    }
  }

  visit_();
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer methods

function isGroup(layer) {
  return layer instanceof MSLayerGroup || layer instanceof MSArtboardGroup;
}

function isSymbol(layer) {
  return layer.parentOrSelfIsSymbol(); 
}

function isArtboard(layer) {
  return layer instanceof MSArtboardGroup;
}

function isArtboardOrTopLevelGroup(layer) {
  return layer.parentGroup() instanceof MSPage;
}

function captureLayerImage(context, layer) {
  var path = NSTemporaryDirectory().stringByAppendingPathComponent(
      NSUUID.UUID().UUIDString() + ".png");
  var trimRect = MSSliceTrimming.trimmedRectForSlice(layer);
  var slice = MSExportRequest.requestWithRect_scale_(trimRect, 1);
  slice.shouldTrim = false;
  context.document.saveArtboardOrSlice_toFile_(slice, path);
  return NSImage.alloc().initWithContentsOfFile(path);
}

function setLayerUserValue(layer, key, value) {
  context.command.setValue_forKey_onLayer_(value, key, layer);
}

function getLayerUserValue(layer, key) {
  return context.command.valueForKey_onLayer_(key, layer);
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Cocoa/AppKit helpers

function cloneView(view) {
  var archivedView = NSKeyedArchiver.archivedDataWithRootObject(view);
  return NSKeyedUnarchiver.unarchiveObjectWithData(archivedView);
}

function restackViews(views, options) {
  if (!views.length) {
    return;
  }

  options = options || {};
  if (!('spacing' in options)) {
    options.spacing = 5;
  }

  if (!('distToTop' in options)) {
    options.distToTop = views[0].superview().frame().size.height
        - (views[0].frame().origin.y + views[0].frame().size.height);
  }

  if (options.resizeParent) {
    if (options.resizeParent === true) {
      options.resizeParent = views[0].superview();
    }

    var newHeight = options.distToTop + options.spacing * (views.length - 1);
    for (var i = 0; i < views.length; i++) {
      newHeight += views[i].frame().size.height;
    }

    if (options.bottomMargin) {
      newHeight += options.bottomMargin;
    }

    if (options.minHeight) {
      newHeight = Math.max(options.minHeight, newHeight);
    }

    options.resizeParent.setFrameSize(CGSizeMake(options.resizeParent.frame().size.width, newHeight));
  }

  var y = views[0].superview().frame().size.height - options.distToTop;
  for (var i = 0; i < views.length; i++) {
    y -= views[i].frame().size.height;
    views[i].setFrameOrigin(CGPointMake(views[i].frame().origin.x, y));
    y -= options.spacing;
  }
}

function showViewAsLayerPopover(context, view, layer) {
  if (!layer || !view) {
    return null;
  }

  var docView = context.document.currentView();
  var docViewWidth = docView.frame().size.width;
  var docViewHeight = docView.frame().size.height;
  var so = docView.scrollOrigin(); // pixel position of 0,0 in the document, relative to doc view top left
  var zoom = docView.zoomValue();

  var absoluteRect = layer.absoluteRect();

  var preferredEdge = NSMaxYEdge;
  var rect = NSMakeRect(
      so.x + absoluteRect.x() * zoom,
      so.y + absoluteRect.y() * zoom,
      absoluteRect.width() * zoom,
      absoluteRect.height() * zoom);

  if (rect.origin.x + rect.size.width < 0) {
    rect.origin.x = 0;
    rect.size.width = 1;
    preferredEdge = NSMaxXEdge;
  }
  if (rect.origin.y + rect.size.height < 0) {
    rect.origin.y = 0;
    rect.size.height = 1;
    preferredEdge = NSMaxYEdge;
  }
  if (rect.origin.x > docViewWidth) {
    rect.origin.x = docViewWidth - 1;
    rect.size.width = 1;
    preferredEdge = NSMinXEdge;
  }
  if (rect.origin.y > docViewHeight) {
    rect.origin.y = docViewHeight - 1;
    rect.size.height = 1;
    preferredEdge = NSMinYEdge;
  }

  var viewController = NSViewController.alloc().init();
  viewController.setView(view);

  var popover = NSPopover.alloc().init();
  popover.setContentViewController(viewController);
  popover.behavior = NSPopoverBehaviorSemitransient; // semitransient prevents accidental multiple stacked popovers
  popover.showRelativeToRect_ofView_preferredEdge_(rect, docView, preferredEdge);
  return popover;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer content cache helpers

// function computeLayerContentHash(layer) {
//   var data = [];

//   function hashobj_(obj) {
//     var matched = false;
//     if (obj && obj.isKindOfClass) {
//       if (obj.isKindOfClass(NSArray) || obj.isKindOfClass(MSArray)) {
//         matched = true;
//         data.push('num:' + obj.count());
//         for (var i = 0; i < obj.count(); i++) {
//           hashobj_(obj.objectAtIndex(i));
//         }
//       } else if (obj.isKindOfClass(MSLayer)) {
//         matched = true;
//         hashproperties_(obj, ['name', 'frame', 'isVisible', 'rotation', 'isFlippedHorizontal', 'isFlippedVertical', 'style']);
//         hashproperties_(obj.frame(), ['x', 'y', 'width', 'height']);

//         if (obj.isKindOfClass(MSTextLayer)) {
//           hashproperties_(obj, ['fontSize', 'fontPostscriptName', 'textColor', 'textAlignment', 'characterSpacing', 'lineSpacing', 'stringValue']);
//         } else if (obj.isKindOfClass(MSBitmapLayer)) {
//           hashproperties_(obj, ['NSImage']);
//         }
//       } else if (obj.isKindOfClass(MSRect)) {
//         matched = true;
//         hashproperties_(obj, ['x', 'y', 'width', 'height']);
//       } else if (obj.isKindOfClass(MSStyle)) {
//         matched = true;
//         hashproperties_(obj.contextSettings(), ['opacity', 'blendMode']);
//         hashobj_(obj.borders().array());
//         hashobj_(obj.fills().array());
//         hashobj_(obj.shadows().array());
//         hashobj_(obj.innerShadows().array());
//       } else if (obj.isKindOfClass(MSStyleFill)) {
//         matched = true;
//         hashproperties_(obj, ['fillType', 'noiseIntensity', 'color', 'gradient', 'image', 'isEnabled']);
//       } else if (obj.isKindOfClass(MSStyleBorder)) {
//         matched = true;
//         hashproperties_(obj, ['position', 'thickness', 'fillType', 'color', 'gradient', 'isEnabled']);
//       } else if (obj.isKindOfClass(MSStyleInnerShadow) || obj.isKindOfClass(MSStyleShadow)) {
//         matched = true;
//         hashproperties_(obj, ['offsetX', 'offsetY', 'blurRadius', 'spread', 'color', 'isEnabled']);
//       } else if (obj.isKindOfClass(MSGradient)) {
//         matched = true;
//         hashproperties_(obj, ['gradientType', 'from', 'to', 'stops']);
//       } else if (obj.isKindOfClass(MSGradientStop)) {
//         matched = true;
//         hashproperties_(obj, ['position', 'color']);
//       }
//     }

//     if (!matched) {
//       data.push(String(obj));
//     }
//   }

//   function hashproperties_(obj, props) {
//     props.forEach(function(prop) {
//       hashobj_(obj[prop]());
//     });
//   }

//   hashobj_(layer);

//   return hashString(data.join('|'));
// }

// function hashString(s) {
//   s = s || '';
//   var h = 0, i, chr, len;
//   if (s.length === 0) return h;
//   for (i = 0, len = s.length; i < len; i++) {
//     chr   = s.charCodeAt(i);
//     h  = ((h << 5) - h) + chr;
//     h |= 0; // Convert to 32bit integer
//   }

//   return h;
// }

////////////////////////////////////////////////////////////////////////////////////////////////////
// Tree traversal helpers

function walkLayerTree(rootLayer, visitFunction, finishFunction) {
  visit_(rootLayer, finishFunction);

  function visit_(layer, finishLayerFunction) {
    var iter = {
      finishLayer: finishLayerFunction,
      walkChildren: function(walkChildrenFinishFunction) {
        if (!('layers' in layer)) {
          walkChildrenFinishFunction([]);
          return;
        }

        var subLayers = [];
        var i = 0;
        for (i = 0; i < layer.layers().count(); i++) {
          subLayers.push(layer.layers().objectAtIndex(i));
        }

        i = 0;
        var childReturnValues = [];

        function visitChild_() {
          if (i >= subLayers.length) {
            walkChildrenFinishFunction(childReturnValues);
            return;
          }

          visit_(
              subLayers[i],
              function(returnValue) {
                childReturnValues.push(returnValue);
                ++i;
                visitChild_();
              });
        }

        visitChild_();
      }
    };

    visitFunction(layer, iter);
  }
}