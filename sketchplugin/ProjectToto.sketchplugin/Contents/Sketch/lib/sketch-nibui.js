/*
 * Copyright 2015 Google Inc.
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

function NibUI(context, bundleResourceName, nibName, bindViewNames) {
  bindViewNames = bindViewNames || [];

  var bundlePath = context.plugin.urlForResourceNamed(bundleResourceName).path();
  this._bundle = NSBundle.bundleWithPath(bundlePath);

  var selectors = {};
  var me = this;

  bindViewNames.forEach(function(bindViewName) {
    var setterName = 'set' + bindViewName.substring(0, 1).toUpperCase() + bindViewName.substring(1);
    selectors[setterName + ':'] = function(arg) {
      me[bindViewName] = arg;
    };
  });

  this._nibOwner = instantiateObjectWithSelectors(selectors);

  var tloPointer = MOPointer.alloc().initWithValue(null);

  if (this._bundle.loadNibNamed_owner_topLevelObjects_(nibName, this._nibOwner, tloPointer)) {
    var topLevelObjects = tloPointer.value();
    for (var i = 0; i < topLevelObjects.count(); i++) {
      var obj = topLevelObjects.objectAtIndex(i);
      if (obj.className().endsWith('View')) {
        this.view = obj;
        break;
      } else if (obj.className().endsWith('Window')) {
        this.window = obj;
        break;
      }
    }
  } else {
    throw new Error('Could not load nib');
  }
}

function _randomId() {
  return (1000000 * Math.random()).toFixed(0);
}

/**
 * Helper function for making click handlers (for use in NSButton.setAction).
 */
NibUI.prototype.attachTargetAndAction = function(views, fn) {
  if (!this._clickActionNames) {
    this._clickActionNames = {};
  }

  var clickActionName;
  while (true) {
    clickActionName = 'zzzTempClickAction' + _randomId();
    if (!(clickActionName in this._clickActionNames)) {
      break;
    }
  }

  this._clickActionNames[clickActionName] = true;

  var selectorStr = clickActionName + ':';
  var selectors = {};
  selectors[selectorStr] = fn;
  addSelectorsToObject(this._nibOwner, selectors);

  if (!Array.isArray(views)) {
    views = [views];
  }

  var me = this;
  views.forEach(function(view) {
    view.setTarget(me._nibOwner);
    view.setAction(NSSelectorFromString(selectorStr));
  });
};

/**
 * Release all resources.
 */
NibUI.prototype.destroy = function() {
  this._bundle.unload();
};

/**
 * Helper for creating objects that respond to selectors.
 */
function instantiateObjectWithSelectors(selectors) {
  selectors = selectors || {};

  // create a class name that doesn't exist yet. note that we can't reuse the same
  // definition lest Sketch will throw an MOJavaScriptException when binding the UI,
  // probably due to JavaScript context / plugin lifecycle incompatibility
  var tempClassName;
  while (true) {
    tempClassName = 'TemporaryClass' + _randomId();
    if (NSClassFromString(tempClassName) == null) {
      break;
    }
  }

  var me = this;

  // register the temporary class and set up instance methods that will be called for
  // each bound view

  var klass = MOClassDescription.allocateDescriptionForClassWithName_superclass_(
      tempClassName, NSClassFromString('NSObject'));

  for (var selector in selectors) {
    klass.addInstanceMethodWithSelector_function_(
        NSSelectorFromString(selector), selectors[selector]);
  }

  klass.registerClass();

  var obj = NSClassFromString(tempClassName).alloc().init();
  obj._class = klass;
  return obj;
}

/**
 * Add selectors to the given object's class. Must've been created with the
 * instantiateObjectWithSelectors method.
 */
function addSelectorsToObject(obj, selectors) {
  if (!obj._class) {
    throw new Error('addSelectorsToObject requires the object to have been created with '
        + 'instantiateObjectWithSelectors.');
  }

  for (var selector in selectors) {
    obj._class.addInstanceMethodWithSelector_function_(
        NSSelectorFromString(selector), selectors[selector]);
  }
}