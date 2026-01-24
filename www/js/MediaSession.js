// Media Session API for lock-screen & Android Auto
document.addEventListener('deviceready', () => {
    if (!window.MediaSession) return;

    MediaSession.configure({
        metadata: {
            title: 'KLS Radio',
            artist: 'Kingdom Lifestyle Radio',
            album: 'Live Stream',
            artwork: [{ src: 'www/images/icon.png', sizes: '512x512', type: 'image/png' }]
        },
        actions: [
            {
                action: 'play',
                callback: () => BackgroundAudio.play(BackgroundAudio.getCurrentUrl())
            },
            {
                action: 'pause',
                callback: () => BackgroundAudio.pause()
            },
            {
                action: 'stop',
                callback: () => BackgroundAudio.stop()
            },
            {
                action: 'nexttrack',
                callback: () => {
                    // Optional: Implement next track logic
                }
            },
            {
                action: 'previoustrack',
                callback: () => {
                    // Optional: Implement previous track logic
                }
            }
        ]
    });
});
