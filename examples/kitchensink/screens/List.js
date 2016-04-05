'use strict';

screen.defaultSharedElements = ['navbar'];

// Could use ES6 features if you want...
$('#row_target').hotspot(function () {
  return toto.getScreen('Detail').show({
    sharedElements: ['avatar', 'Bryan_McDonald'].concat(screen.defaultSharedElements)
  });
});

// ...like this.
$('#tabs').on('tabchange', function (ev, tabIndex) {
  return $('#tab_targets').children().each(function (idx, el) {
    return $(el).animate({ opacity: idx == tabIndex ? 1 : 0.4 });
  });
});