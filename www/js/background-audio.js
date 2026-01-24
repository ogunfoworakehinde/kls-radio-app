// Background Audio Service for Cordova Android App

let media = null;
let isPlaying = false;
let currentStreamUrl = '';

document.addEventListener('deviceready', () => {
    console.log('Cordova device ready for background audio');

    // Enable background mode
    if (cordova.plugins.backgroundMode) {
        cordova.plugins.backgroundMode.enable();
        cordova.plugins.backgroundMode.setDefaults({
            title: 'KLS Radio',
            text: 'Playing Kingdom Lifestyle Radio',
            icon: 'icon',
            color: '0a0f2d',
            resume: true,
            hidden: false,
            bigText: true,
            channelName: 'KLS Radio Player',
            channelDescription: 'Background audio playback',
            importance: 4,
            allowClose: false,
            silent: false
        });

        cordova.plugins.backgroundMode.on('activate', () => {
            cordova.plugins.backgroundMode.disableWebViewOptimizations();
            cordova.plugins.backgroundMode.disableBatteryOptimizations();
        });
    }
}, false);

function initBackgroundAudio(streamUrl) {
    currentStreamUrl = streamUrl;

    if (!window.Media) {
        console.error('Media plugin not available');
        return;
    }

    media = new Media(
        streamUrl,
        () => console.log('Playback finished'),
        (err) => {
            console.error('Playback error', err);
            // Auto-reconnect after 3s if still supposed to be playing
            if (isPlaying) setTimeout(() => playBackgroundAudio(streamUrl), 3000);
        },
        (status) => console.log('Media status', status)
    );

    media.setVolume?.('1.0');
}

function playBackgroundAudio(streamUrl) {
    if (!media || currentStreamUrl !== streamUrl) initBackgroundAudio(streamUrl);
    if (media) {
        media.play();
        isPlaying = true;
        if (cordova.plugins.backgroundMode) {
            cordova.plugins.backgroundMode.configure({
                text: 'Playing: Kingdom Lifestyle Radio',
                ticker: 'KLS Radio is playing'
            });
        }
    }
}

function pauseBackgroundAudio() {
    if (media && isPlaying) {
        media.pause();
        isPlaying = false;
        if (cordova.plugins.backgroundMode)
            cordova.plugins.backgroundMode.configure({ text: 'KLS Radio - Paused' });
    }
}

function stopBackgroundAudio() {
    if (media) {
        media.stop();
        media.release();
        media = null;
        isPlaying = false;
        currentStreamUrl = '';
        cordova.plugins.backgroundMode?.disable();
    }
}

window.BackgroundAudio = {
    play: playBackgroundAudio,
    pause: pauseBackgroundAudio,
    stop: stopBackgroundAudio,
    isPlaying: () => isPlaying,
    getCurrentUrl: () => currentStreamUrl
};
