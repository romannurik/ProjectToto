screen.defaultSharedElements = ['navbar'];

screen.onPreShow(() => $('#more, #back, #Buttons').css('opacity', 0));

screen.onShow(() => $('#more, #back, #Buttons').animate({ opacity: 1 }));

$('#back').hotspot(() =>
  toto.getScreen('Main').show({
    sharedElements: ['road_trip_image', 'road_trip_text'].concat(screen.defaultSharedElements)
  }));

