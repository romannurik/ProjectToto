var l = screen.newLayer('foo')
    .css({
      width: screen.width,
      height: screen.height,
      backgroundColor: 'purple',
    })
    .hotspot(() =>
      toto.getScreen('main').show({
        sharedElements: 'foo'
      }));