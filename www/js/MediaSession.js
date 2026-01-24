function updateMediaSession(state) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'KLS Radio',
        artist: 'Kingdom Lifestyle Radio',
        album: 'Live Gospel Stream',
        artwork: [
            {
                src: 'images/icon.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
        BackgroundAudio.play(BackgroundAudio.getCurrentUrl());
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        BackgroundAudio.pause();
    });

    navigator.mediaSession.setActionHandler('stop', () => {
        BackgroundAudio.stop();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {});
    navigator.mediaSession.setActionHandler('nexttrack', () => {});

    navigator.mediaSession.playbackState = state;
}
