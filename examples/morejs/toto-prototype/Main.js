screen.defaultSharedElements = ['navbar'];

var moreTop = $('#more').top();

$('#road_trips').hotspot(() =>
  toto.getScreen('Road_Trips').show({
    sharedElements: ['road_trip_image', 'road_trip_text'].concat(screen.defaultSharedElements)
  })
);

$('#cards').on('scroll', () => {
  var scrollTop = $('#cards').scrollTop();
  var appBarHeight = $('#app_bar').height();
  var top = Math.max(-scrollTop, -(appBarHeight - 56 - 24));
  $('#app_bar').top(top);
  $('#more').top(moreTop - top);
});