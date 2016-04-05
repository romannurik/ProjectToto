'use strict';

screen.defaultSharedElements = ['navbar'];

screen.onPreShow(function () {
  return $('#more, #back, #Buttons').css('opacity', 0);
});

screen.onShow(function () {
  return $('#more, #back, #Buttons').animate({ opacity: 1 });
});

$('#back').hotspot(function () {
  return toto.getScreen('Main').show({
    sharedElements: ['road_trip_image', 'road_trip_text'].concat(screen.defaultSharedElements)
  });
});