var springOptions = [25, 4];

var unspring = () => $l.velocity({scale: 1}, springOptions, {easing: 'spring'});

var $l = screen.newLayer('foo')
    .css({
      left: (screen.width - 100) / 2,
      top: (screen.height - 100) / 2,
      width: 100,
      height: 100,
      backgroundColor: 'blue',
    })
    .on('mousedown', () => $l.velocity({scale: 0.5}, springOptions, {easing: 'spring'}))
    .on('mouseleave', unspring)
    .hotspot(() =>
      toto.getScreen('detail').show({
        sharedElements: 'foo'
      }));

screen.$root.on('mouseup', unspring);