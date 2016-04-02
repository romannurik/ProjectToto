screen.defaultSharedElements = ['navbar'];

// Could use ES6 features if you want...
$('#row_target').hotspot(() =>
  toto.getScreen('Detail').show({
    sharedElements: ['avatar', 'Bryan_McDonald'].concat(screen.defaultSharedElements)
  }));

// ...like this.
$('#tabs').on('tabchange', (ev, tabIndex) =>
  $('#tab_targets').children().each((idx, el) =>
    $(el).animate({ opacity: idx == tabIndex ? 1 : 0.4 })
  )
);