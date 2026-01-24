let media = null;
let isPlaying = false;
let currentStreamUrl = '';

document.addEventListener('deviceready', () => {
    if (cordova.plugins.backgroundMode) {
        cordova.plugins.backgroundMode.enable();
        cordova.plugins.backgroundMode.setDefaults({
            title: 'KLS Radio',
            text: 'Playing Kingdom Lifestyle Radio',
            icon: 'icon',
            color: '0a0f2d',
            resume: true,
            hidden: false,
            silent: false,
            allowClose: false
        });

        cordova.plugins.backgroundMode.on('activate', () => {
            cordova.plugins.backgroundMode.disableWebViewOptimizations();
        });
    }
});

function initMedia(streamUrl) {
    currentStreamUrl = streamUrl;

    if (!window.Media) {
        console.error('cordova-plugin-media not available');
        return;
    }

    media = new Media(
        streamUrl,
        () => console.log('Stream ended'),
        (err) => {
            console.error('Stream error', err);
            // Auto-reconnect
            if (isPlaying) setTimeout(() => play(streamUrl), 3000);
        }
    );
}

function play(streamUrl) {
    if (!media || currentStreamUrl !== streamUrl) {
        initMedia(streamUrl);
    }

    media.play();
    isPlaying = true;

    updateMediaSession('playing');
}

function pause() {
    if (media && isPlaying) {
        media.pause();
        isPlaying = false;
        updateMediaSession('paused');
    }
}

function stop() {
    if (media) {
        media.stop();
        media.release();
        media = null;
        isPlaying = false;
        currentStreamUrl = '';
        updateMediaSession('stopped');
    }
}

window.BackgroundAudio = {
    play,
    pause,
    stop,
    isPlaying: () => isPlaying,
    getCurrentUrl: () => currentStreamUrl
};
