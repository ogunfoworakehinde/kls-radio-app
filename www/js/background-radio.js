document.addEventListener('deviceready', function() {

  // Keep app running in background
  cordova.plugins.backgroundMode.enable();
  cordova.plugins.backgroundMode.setDefaults({
    title: 'KLS Radio',
    text: 'Live Radio Streaming...',
    icon: 'icon', // name of icon in www/images/icon.png without extension
    color: '#0a0f2d'
  });

  // Prevent device from sleeping
  cordova.plugins.powermanagement.acquire();

  // Music Controls
  MusicControls.create({
    track       : 'KLS Radio',
    artist      : 'Kingdom Lifestyle Radio',
    cover       : 'https://kingdomlifestyleradio.com/logo.png', // optional
    isPlaying   : true,
    dismissable : false,
    hasPrev     : false,
    hasNext     : false,
    hasClose    : false
  }, function() {
      console.log('MusicControls created');
  }, function(err){
      console.error('Error creating MusicControls', err);
  });

  // Handle Music Control events
  MusicControls.subscribe(function(action) {
    switch(action) {
      case 'music-controls-play':
        playStream();
        MusicControls.updateIsPlaying(true);
        break;
      case 'music-controls-pause':
        pauseStream();
        MusicControls.updateIsPlaying(false);
        break;
    }
  });

  MusicControls.listen();

  // Audio stream
  let audio = new Audio('https://your-radio-stream-url.com/stream');
  audio.loop = true;

  function playStream() {
    audio.play().catch(e => console.error(e));
  }

  function pauseStream() {
    audio.pause();
  }

  // Autoplay
  playStream();

}, false);
