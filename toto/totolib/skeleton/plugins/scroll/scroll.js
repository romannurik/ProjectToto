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

var PAGER_VELOCITY_THRESHOLD = 300; // pixels per second
var TOUCH_SLOP = 5; // pixels

toto.onLoadLayer(function(layerData, $layer, screen) {
  if ((layerData.layers || []).length) {
    if (layerData.annotations.scroll) {
      // make a layer scrollable
      makeScrollView($layer, layerData.annotations.scroll != 'horizontal');
    } else if (layerData.annotations.pager) {
      // turn a layer into a pager container
      makePager($layer);
      $layer.children().show();
    }
  }

  // when clicking this layer, slide a pager to the given position
  if (layerData.annotations.slidePager) {
    var parts = layerData.annotations.slidePager.split(/:/g);
    var targetLayerName = parts[0];
    var slidePosition = parseInt(parts[1], 10);
    if (!$layer.hotspot) {
      console.error('Please include the hotspot plugin to enable the slidePager action.');
    }
    $layer.hotspot(() => screen.$$('#' + targetLayerName).pagerSlidePager(slidePosition));
  }
});

$.fn.pagerSlidePager = function(position) {
  var pageWidth = this.data('pageWidth');
  this.animate({ left: -pageWidth * position }, { duration: 250 });
};

function x_(ev) {
  return ev.clientX || ev.originalEvent.changedTouches[0].clientX;
}

function y_(ev) {
  return ev.clientY || ev.originalEvent.changedTouches[0].clientY;
}

var evLast, evRecent;

var $activePager;
var activePagerWidth;
var activePagerNumPages;
var pagingEngaged = false;
var justHadPagingEngaged;

function makePager($pager) {
  var $pages = $pager.children();
  var pagerLeft = $pager.left();
  var pageWidth = $pager.width();
  for (var i = 0; i < $pages.length; i++) {
    var $child = $pages.eq(i);
    $child.left(pagerLeft + pageWidth * i);
  }

  $pager
    .data('pageWidth', pageWidth)
    .width(pageWidth * $pages.length)
    .addClass('pager')
    .on('mousedown touchstart', function(ev) {
      evLast = copyEventSimple(ev);
      $activePager = $pager;
      activePagerWidth = $pager.data('pageWidth');
      activePagerNumPages = $pages.length;
      pagingEngaged = false;
    })
    .on('click', function(ev) {
      if (justHadPagingEngaged) {
        ev.stopPropagation();
        justHadPagingEngaged = false;
        return false;
      }
    });
}

$(window)
    .on('mousemove touchmove', function(ev) {
      if (!$activePager) {
        return;
      }

      if (!pagingEngaged) {
        if (Math.abs(x_(ev) - x_(evLast)) > TOUCH_SLOP) {
          // satisfied horizontal touch slop, start paging
          pagingEngaged = true;
          $activePager.addClass('engaged');
        } else if (Math.abs(y_(ev) - y_(evLast)) > TOUCH_SLOP) {
          // satisfied vertical touch slop, cancel paging
          $activePager = null;
        }

      } else {
        var currentLeft = $activePager.left();
        var newLeft = currentLeft + x_(ev) - x_(evLast);
        newLeft = Math.min(0, newLeft);
        newLeft = Math.max(-activePagerWidth * (activePagerNumPages - 1), newLeft);
        $activePager.left(newLeft);
        evRecent = copyEventSimple(evLast);
        evLast = copyEventSimple(ev);
        $activePager.trigger('pageslide', [-newLeft / activePagerWidth, false]);

        // prevent default behavior (vertical scroll)
        ev.preventDefault();
      }
    })
    .on('mouseup touchend', function(ev) {
      if (!$activePager) {
        return;
      }

      if (pagingEngaged) {
        var left = $activePager.left();
        if (left % activePagerWidth != 0) {
          var velocity =
              (x_(evLast) - x_(evRecent)) /
              (evLast.timeStamp - evRecent.timeStamp + 1) * 1000;

          // default to position-based settle
          var newLeft = Math.round(left / activePagerWidth) * activePagerWidth;
          if (Math.abs(velocity) > PAGER_VELOCITY_THRESHOLD) {
            // velocity-based settle
            if (velocity > 0) {
              newLeft = Math.ceil(left / activePagerWidth) * activePagerWidth;
            } else {
              newLeft = Math.floor(left / activePagerWidth) * activePagerWidth;
            }
          }
          $activePager.animate({left: newLeft}, 200);
          $activePager.trigger('pageslide', [-newLeft / activePagerWidth, true]);
        }

        justHadPagingEngaged = true;
      }

      $activePager.removeClass('engaged');
      $activePager = null;
      pagingEngaged = false;
    });


var $activeScroller;
var activeScrollVertical;
var scrollingEngaged = false;
var currentScrollSettleAnimation;
var justHadScrollingEngaged;

function makeScrollView($scroller, vertical) {
  $scroller
    .addClass('scroll-' + (vertical ? 'vertical' : 'horizontal'))
    .on('mousedown', function(ev) {
      evLast = copyEventSimple(ev);
      activeScrollVertical = vertical;
      $activeScroller = $(this);
      scrollingEngaged = false;
      // cancel any existing scroll settle animations
      currentScrollSettleAnimation = null;
    })
    .on('click', function(ev) {
      if (justHadScrollingEngaged) {
        ev.stopPropagation();
        justHadScrollingEngaged = false;
        return false;
      }
    });

  // the bottom-most layer is a mask, remove it, but
  // keep its background image if it has one
  // var $maskChild = $scroller.children().last();
  // if ($maskChild.hasClass('has-image')) {
  //   var url = $maskChild.css('background-image');
  //   $scroller.css('background-image', url);
  // }
  // $maskChild.remove();
}


$(window)
  .on('mousemove', function(ev) {
    if (!$activeScroller) {
      return;
    }

    var vf_ = activeScrollVertical ? y_ : x_;
    var stf = activeScrollVertical ? 'scrollTop' : 'scrollLeft';

    if (!scrollingEngaged) {
      if (Math.abs(vf_(ev) - vf_(evLast)) > TOUCH_SLOP) {
        // satisfied vertical touch slop, start scrolling
        scrollingEngaged = true;
        $activeScroller.addClass('engaged');
      }

    } else {
      $activeScroller[stf]($activeScroller[stf]() - (vf_(ev) - vf_(evLast)));
      evRecent = copyEventSimple(evLast);
      evLast = copyEventSimple(ev);

      // prevent default behavior (vertical scroll)
      ev.preventDefault();
    }
  })
  .on('mouseup', function(ev) {
    if (!$activeScroller) {
      return;
    }

    var vf_ = activeScrollVertical ? y_ : x_;
    var stf = activeScrollVertical ? 'scrollTop' : 'scrollLeft';

    if (scrollingEngaged) {
      var velocity =
          (vf_(evLast) - vf_(evRecent)) /
          (evLast.timeStamp - evRecent.timeStamp + 1) * 1000;

      animateScrollSettle($activeScroller, velocity, activeScrollVertical);
      justHadScrollingEngaged = true;
    }

    $activeScroller.removeClass('engaged');
    $activeScroller = null;
    scrollingEngaged = false;
  });

var SCROLL_DECELERATION = 1000; // pixels per second per second

function animateScrollSettle($scroller, startVelocity, vertical) {
  var stf = activeScrollVertical ? 'scrollTop' : 'scrollLeft';
  var velocity = startVelocity;
  var timeLast = (new Date()).getTime();

  currentScrollSettleAnimation = function() {
    var timeNow = (new Date()).getTime();
    var timeDelta = (timeNow - timeLast);
    timeLast = timeNow;

    // calculate position delta based on current velocity
    var posDelta = velocity * timeDelta / 1000;

    // scroll the scroller
    $scroller[stf]($scroller[stf]() - posDelta);

    // compute new velocity
    var velocityNegative = (velocity < 0);
    velocity = Math.max(0, Math.abs(velocity) - SCROLL_DECELERATION / 1000 * timeDelta);
    if (velocityNegative) {
      velocity = -velocity;
    }

    if (Math.abs(velocity) > 0 && currentScrollSettleAnimation) {
      requestAnimationFrame(currentScrollSettleAnimation);
    }
  };

  requestAnimationFrame(currentScrollSettleAnimation);
}

function copyEventSimple(ev) {
  if (!ev) {
    return null;
  }

  //return $.Event(null, ev);
  var n = {
    clientX: ev.clientX,
    clientY: ev.clientY,
    timeStamp: ev.timeStamp,
    originalEvent: {
      changedTouches: []
    }
  };

  if (ev.originalEvent.changedTouches && ev.originalEvent.changedTouches.length) {
    n.originalEvent.changedTouches.push({
      clientX: ev.originalEvent.changedTouches[0].clientX,
      clientY: ev.originalEvent.changedTouches[0].clientY
    });
  }

  return n;
}

})();