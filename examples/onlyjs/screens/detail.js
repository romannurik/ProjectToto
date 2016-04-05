'use strict';

var l = screen.newLayer('foo').css({
  width: screen.width,
  height: screen.height,
  backgroundColor: 'purple'
}).hotspot(function () {
  return toto.getScreen('main').show({
    sharedElements: 'foo'
  });
});