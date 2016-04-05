'use strict';

toto.onLoadLayer(function (layerData, $layer, screen) {
  if (layerData.annotations.tabindicator) {
    $layer.addClass('tab-indicator');
  } else if (layerData.annotations.tabtargets) {
    $layer.addClass('tab-targets');
  } else if (layerData.annotations.tabs) {
    var contentPager = layerData.annotations.tabs;

    setTimeout(function () {
      var $targets = $layer.find('.tab-targets');
      var $indicator = $layer.find('.tab-indicator');
      var $pager = screen.$('#' + contentPager);

      $targets.children().hotspot(function () {
        var tabIndex = $(this).index();
        slideTabIndicator(tabIndex);
        $pager.pagerSlidePager(tabIndex);
      });

      $pager.on('pageslide', function (ev, position, settle) {
        if (settle) {
          slideTabIndicator(Math.floor(position));
        }
      });

      function slideTabIndicator(tabIndex) {
        var $target = $targets.children().eq(tabIndex);
        $indicator.animate({
          left: $target.left(),
          width: $target.width()
        }, { duration: 250 });

        $layer.trigger('tabchange', [tabIndex, $target]);
      }
    }, 10);
  }
});