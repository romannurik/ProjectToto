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

// TODO: it might be a bad idea to override jQuery built-in methods

$.fn.show = function(show) {
  show = (show === undefined) ? true : show;
  this.toggleClass('hidden', !show);
  return this;
};

$.fn.hide = function() {
  this.toggleClass('hidden', true);
  return this;
};

$.fn.name = function(value) {
  if (value !== undefined) {
    this.attr('id', value);
    return this;
  }
  return this.attr('id');
};

$.fn.left = function(value) {
  if (value !== undefined) {
    this.css('left', value);
    return this;
  }
  return parseInt(this.css('left'), 10) || 0;
};

$.fn.top = function(value) {
  if (value !== undefined) {
    this.css('top', value);
    return this;
  }
  return parseInt(this.css('top'), 10) || 0;
};

$.fn.position = function() {
  // dont use .offset() because it factors in CSS transforms
  return {
    left: this.left(),
    top: this.top()
  };
};

$.fn.positionInScreen = function() {
  // dont use .offset() because it factors in CSS transforms
  var left = 0;
  var top = 0;
  var $layer = this;
  while (true) {
    if (!$layer || $layer.prop('tagName').toLowerCase() == 'toto-screen') {
      break;
    }

    left += $layer.left() - $layer.scrollLeft();
    top += $layer.top() - $layer.scrollTop();
    $layer = $layer.parent();
  }

  return {
    left: left,
    top: top
  };
};

// Additional properties (primarily for animation purposes)

$.cssNumber.scale = true;
$.cssHooks['scale'] = {
  get: function(elem, computed, extra) {
    return $(elem).prop('scale') || 1;
  },
  set: function(elem, value) {
    $(elem)
        .prop('scale', value)
        .css('transform', _cssTransformString($(elem)));
  }
};

$.cssNumber.rotation = true;
$.cssHooks['rotation'] = {
  get: function(elem, computed, extra) {
    return $(elem).prop('rotation') || 0;
  },
  set: function(elem, value) {
    $(elem)
        .prop('rotation', value)
        .css('transform', _cssTransformString($(elem)));
  }
};

function _cssTransformString($elem) {
  var t = '';
  if ($elem.prop('rotation')) {
    t += 'rotate(' + $elem.prop('rotation') + 'deg) ';
  }
  if ($elem.prop('scale') != 1) {
    t += 'scale(' + $elem.prop('scale') + ') ';
  }
  return t;
}