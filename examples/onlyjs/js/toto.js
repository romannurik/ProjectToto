'use strict';

/******/(function (modules) {
	// webpackBootstrap
	/******/ // The module cache
	/******/var installedModules = {};

	/******/ // The require function
	/******/function __webpack_require__(moduleId) {

		/******/ // Check if module is in cache
		/******/if (installedModules[moduleId])
			/******/return installedModules[moduleId].exports;

		/******/ // Create a new module (and put it into the cache)
		/******/var module = installedModules[moduleId] = {
			/******/exports: {},
			/******/id: moduleId,
			/******/loaded: false
			/******/ };

		/******/ // Execute the module function
		/******/modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

		/******/ // Flag the module as loaded
		/******/module.loaded = true;

		/******/ // Return the exports of the module
		/******/return module.exports;
		/******/
	}

	/******/ // expose the modules object (__webpack_modules__)
	/******/__webpack_require__.m = modules;

	/******/ // expose the module cache
	/******/__webpack_require__.c = installedModules;

	/******/ // __webpack_public_path__
	/******/__webpack_require__.p = "";

	/******/ // Load entry module and return exports
	/******/return __webpack_require__(0);
	/******/
})(
/************************************************************************/
/******/[
/* 0 */
/***/function (module, exports, __webpack_require__) {

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

	Object.assign(window, __webpack_require__(1));

	window.totoProjectLoader = __webpack_require__(4);

	__webpack_require__(5);
	__webpack_require__(6);

	/***/
},
/* 1 */
/***/function (module, exports, __webpack_require__) {

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

	var context = __webpack_require__(2);
	var totoInternal = __webpack_require__(3);

	var toto = {};

	toto.init = totoInternal.init;

	toto.newScreen = function (screenName) {
		var screen = new TotoScreen();
		screen.name = screenName;
		screen.$root = $('<toto-screen>').name(screen.name).appendTo(context.$root);
		context.screens[screen.name] = screen;
		return screen;
	};

	toto.getScreen = function (screenName) {
		return context.screens[screenName];
	};

	toto.onLoadLayer = function (fn) {
		context.loadLayerCallbacks.push(fn);
	};

	toto.onRebuild = function (fn) {
		context.rebuildCallbacks.push(fn);
	};

	toto.onScreenTransition = function (fn) {
		context.screenTransitionCallbacks.push(fn);
	};

	toto.consumeNextShowHotspots = function () {
		context.consumeNextShowHotspots = true;
	};

	Object.defineProperty(toto, 'currentScreen', {
		get: function get() {
			return context.currentScreen;
		}
	});

	var TotoScreen = function TotoScreen() {
		this.preShowListeners = [];
		this.showListeners = [];
	};

	TotoScreen.prototype.$ = $.extend(function (a, b) {
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

	TotoScreen.prototype.show = function (options) {
		totoInternal.showScreen(this.name, options);
	};

	TotoScreen.prototype.onPreShow = function (listener) {
		this.preShowListeners.push(listener);
	};

	TotoScreen.prototype.onShow = function (listener) {
		this.showListeners.push(listener);
	};

	TotoScreen.prototype.newLayer = function (layerName, options) {
		var $layer = $('<toto-layer>').prependTo(this.$root);
		if (layerName) {
			$layer.name(layerName);
		}
		return $layer;
	};

	Object.defineProperty(TotoScreen.prototype, 'width', {
		get: function get() {
			return this.$root.width();
		}
	});

	Object.defineProperty(TotoScreen.prototype, 'height', {
		get: function get() {
			return this.$root.height();
		}
	});

	module.exports = { TotoScreen: TotoScreen, toto: toto };

	/***/
},
/* 2 */
/***/function (module, exports) {

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

	module.exports = {
		screens: {},
		currentScreen: null,
		prototypeTitle: null,
		defaultScreenName: null,
		showHotspotsOnClick: true,

		loadLayerCallbacks: [],
		screenTransitionCallbacks: [],
		rebuildCallbacks: []
	};

	/***/
},
/* 3 */
/***/function (module, exports, __webpack_require__) {

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

	var context = __webpack_require__(2);

	var totoInternal = {};

	totoInternal.init = function (rootNode, options) {
		options = options || {};
		options.width = options.width || 360;
		options.height = options.height || 640;
		options.title = options.title || 'Untitled Prototype';

		context.screens = {};
		context.prototypeTitle = options.title;
		context.currentScreen = null;

		context.$root = $(rootNode).empty().css({
			width: options.width,
			height: options.height
		});
	};

	totoInternal.loadScreenFromHash = function () {
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

		totoInternal.showScreen(name, { arg: arg });
	};

	totoInternal.showScreen = function (name, options) {
		var newScreen = context.screens[name];
		if (!newScreen) {
			console.error('No screen with name ' + name);
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
		var nextCallback_ = function nextCallback_() {
			if (i >= context.screenTransitionCallbacks.length) {
				done_();
				return;
			}

			context.screenTransitionCallbacks[i](context.currentScreen, newScreen, options, function () {
				++i;
				nextCallback_();
			});
		};

		var done_ = function done_() {
			return runListeners_(newScreen.showListeners, [options.arg]);
		};

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
	};

	totoInternal.rescale = function () {
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

		$root.css('transform', 'scale(' + scale + ') translateZ(0)');
	};

	function runListeners_(arr, args) {
		(arr || []).forEach(function (listener) {
			return listener.apply(null, args || []);
		});
	}

	module.exports = totoInternal;

	/***/
},
/* 4 */
/***/function (module, exports, __webpack_require__) {

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

	var context = __webpack_require__(2);
	var totoInternal = __webpack_require__(3);

	var _webpack_require__ = __webpack_require__(1);

	var toto = _webpack_require__.toto;
	var TotoScreen = _webpack_require__.TotoScreen;


	var totoProjectLoader = {};

	totoProjectLoader.import = function (metaPath, projectScripts) {
		projectScripts = projectScripts || [];

		$.when($.ajax({ url: metaPath, dataType: 'json' })).done(function (meta) {
			loadProject_(meta);
			var getScriptPromises = projectScripts.filter(function (x) {
				return !!x;
			}).map(function (s) {
				return $.ajax({ url: s, dataType: 'text' });
			});
			$.when.apply(null, getScriptPromises).done(function () {
				for (var i = 0; i < projectScripts.length; i++) {
					var screenName = projectScripts[i].replace(/.js/, '').replace(/.*\//, '');
					var scriptContents = projectScripts.length == 1 ? arguments[0] : arguments[i][0];

					scriptContents = '\n\tvar ___SCREEN___ = toto.getScreen(\'' + screenName + '\');\n\tif (!___SCREEN___) { ___SCREEN___ = toto.newScreen(\'' + screenName + '\'); }\n\t(function(screen, $) {\n\t' + scriptContents + '\n\t})(___SCREEN___, ___SCREEN___.$.bind(___SCREEN___));\n\t';
					$.globalEval(scriptContents);
				}

				totoInternal.loadScreenFromHash();
			}).fail(function (jqxhr, settings, exception) {
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
		context.$root.empty().css({
			width: meta.screenResolution[0].toFixed(0),
			height: meta.screenResolution[1].toFixed(0)
		});

		totoInternal.rescale();

		var screenMetasByName = [];
		meta.screens.forEach(function (screenMeta) {
			return screenMetasByName[screenMeta.name] = screenMeta;
		});
		meta.screens.forEach(function (screenMeta) {
			return loadScreen_(screenMeta, screenMetasByName);
		});

		context.rebuildCallbacks.forEach(function (callback) {
			return callback();
		});
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

			includes.forEach(function (includeName) {
				return loadLayer_({
					meta: includeMetas[includeName],
					screen: screen,
					sourceScreenName: includeName,
					parent: screen.$root,
					root: true
				});
			});
		}

		loadLayer_({
			meta: screenMeta,
			screen: screen,
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

		var $layer = screen.newLayer(layerMeta.name).css({
			left: layerMeta.x + (layerMeta.stylingMargins.l || 0),
			top: layerMeta.y + (layerMeta.stylingMargins.t || 0),
			width: layerMeta.w,
			height: layerMeta.h,
			marginLeft: -(layerMeta.stylingMargins.l || 0) + offset.x, // put the offset (from parent) in the margin so left/top properties are easy to work with
			marginTop: -(layerMeta.stylingMargins.t || 0) + offset.y,
			paddingLeft: layerMeta.stylingMargins.l || 0,
			paddingTop: layerMeta.stylingMargins.t || 0,
			paddingRight: layerMeta.stylingMargins.r || 0,
			paddingBottom: layerMeta.stylingMargins.b || 0,
			opacity: layerMeta.opacity !== undefined ? layerMeta.opacity : 1
		}).appendTo($parent);

		if (!layerMeta.annotations.visible && (layerMeta.hidden || layerMeta.annotations.hidden)) {
			$layer.addClass('hidden');
		}

		if (layerMeta.image) {
			var random = ''; //'?cachebust=' + Math.floor(Math.random() * 1000000);
			$layer.addClass('has-image').css({
				'background-image': 'url("screens/' + sourceScreenName + '/' + layerMeta.image + '.png' + random + '")'
			});
		}

		layerMeta.layers = layerMeta.layers || [];

		if (options.root) {
			layerMeta.layers.forEach(function (subLayer) {
				return loadLayer_({
					meta: subLayer,
					screen: screen,
					sourceScreenName: sourceScreenName,
					parent: $parent
				});
			});

			// convert artboard root layer to background layer, move it to the end
			$layer.name(layerMeta.name + '_Background').appendTo($parent);
		} else if (layerMeta.layers.length) {
			layerMeta.layers.forEach(function (subLayer) {
				return loadLayer_({
					meta: subLayer,
					offset: { x: layerMeta.stylingMargins.l || 0, y: layerMeta.stylingMargins.t || 0 },
					screen: screen,
					sourceScreenName: sourceScreenName,
					parent: $layer
				});
			});
		}

		context.loadLayerCallbacks.forEach(function (callback) {
			return callback(layerMeta, $layer, screen);
		});
	}

	module.exports = totoProjectLoader;

	/***/
},
/* 5 */
/***/function (module, exports) {

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

	$.fn.show = function (show) {
		show = show === undefined ? true : show;
		this.toggleClass('hidden', !show);
		return this;
	};

	$.fn.hide = function () {
		this.toggleClass('hidden', true);
		return this;
	};

	$.fn.name = function (value) {
		if (value !== undefined) {
			this.attr('id', value);
			return this;
		}
		return this.attr('id');
	};

	$.fn.left = function (value) {
		if (value !== undefined) {
			this.css('left', value);
			return this;
		}
		return parseInt(this.css('left'), 10) || 0;
	};

	$.fn.top = function (value) {
		if (value !== undefined) {
			this.css('top', value);
			return this;
		}
		return parseInt(this.css('top'), 10) || 0;
	};

	$.fn.position = function () {
		// dont use .offset() because it factors in CSS transforms
		return {
			left: this.left(),
			top: this.top()
		};
	};

	$.fn.positionInScreen = function () {
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
		get: function get(elem, computed, extra) {
			return $(elem).prop('scale') || 1;
		},
		set: function set(elem, value) {
			$(elem).prop('scale', value).css('transform', _cssTransformString($(elem)));
		}
	};

	$.cssNumber.rotation = true;
	$.cssHooks['rotation'] = {
		get: function get(elem, computed, extra) {
			return $(elem).prop('rotation') || 0;
		},
		set: function set(elem, value) {
			$(elem).prop('rotation', value).css('transform', _cssTransformString($(elem)));
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

	/***/
},
/* 6 */
/***/function (module, exports, __webpack_require__) {

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

	var context = __webpack_require__(2);
	var totoInternal = __webpack_require__(3);

	$(document).ready(function () {
		FastClick.attach(document.body);

		setupFullscreen();
		setupIOSBodyOverscrollFix();
		setupWindowTitleUpdater();

		totoInternal.rescale();
	}).click(function () {
		if (!context.showHotspotsOnClick) {
			return;
		}

		if (context.consumeNextShowHotspots) {
			context.consumeNextShowHotspots = false;
			return;
		}
		$('body').addClass('show-targets');
		setTimeout(function () {
			return $('body').removeClass('show-targets');
		}, 800);
	});

	$(window).on('resize', totoInternal.rescale).on('hashchange', function (ev) {
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

		if (!rfs || 'standalone' in window.navigator && window.navigator.standalone) {
			$('.fullscreen-button').addClass('hidden');
		}

		$(document).click(function () {
			$('.fullscreen-button').addClass('hidden');
		});

		$('.fullscreen-button').click(function () {
			context.consumeNextShowHotspots = true;
			rfs.call(rfsElement);
			return false;
		});

		$(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange', function () {
			$('body').toggleClass('isfullscreen', document.fullScreenElement || document.webkitFullScreenElement || document.mozFullScreenElement);
		});
	}

	function setupIOSBodyOverscrollFix() {
		var scrollFixSkipSelector = '.scroll-vertical, .scroll-horizontal, .scroll';

		$(document).on('touchmove', function (ev) {
			if (!$(ev.target).is(scrollFixSkipSelector)) {
				ev.preventDefault();
			}
		}).on('touchmove', scrollFixSkipSelector, function (ev) {
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
		context.screenTransitionCallbacks.push(function (currentScreen, newScreen, options, callback) {
			document.title = (context.prototypeTitle ? context.prototypeTitle + ': ' : '') + newScreen.name + ' (Toto Prototype)';
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

	/***/
}
/******/]);