screen.defaultSharedElements = ['navbar'];

screen.onPreShow(function() {
  $('#more, #back, #Buttons').css('opacity', 0);
});

screen.onShow(function() {
  $('#more, #back, #Buttons').animate({ opacity: 1 });
});

$('#back').hotspot(function() {
  Toto.getScreen('Main').show({
    sharedElements: ['road_trip_image', 'road_trip_text'].concat(screen.defaultSharedElements)
  });
});

