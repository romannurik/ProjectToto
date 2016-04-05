'use strict';

screen.defaultSharedElements = ['navbar'];

$('#system_back, #back').hotspot(function () {
  return toto.getScreen('List').show({
    sharedElements: ['avatar:avatar', 'Bryan_McDonald'].concat(screen.defaultSharedElements)
  });
});