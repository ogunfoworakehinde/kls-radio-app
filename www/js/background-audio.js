document.addEventListener('deviceready', initPlayer, false);

let media = null;
let currentIndex = null;
let reconnectTimer = null;
let playing = false;

const STATIONS = [
    {
        name: "English Gospel",
        url: "https://s3.voscast.com:9425/stream",
        description: "24/7 English Gospel Music"
    },
    {
        name: "Yoruba Gospel",
        url: "https://s3.voscast.com:10745/stream",
        description: "Yoruba Language Worship"
    },
    {
        name: "Praise Worship",
        url: "https://stream.zeno.fm/f3wvbbqmdg8uv",
        description: "Contemporary Praise"
    }
];

function initPlayer() {
    console.log("KLS Radio ready");

    // Keep CPU awake
    if (window.powerManagement) {
        powerManagement.acquire();
    }

    // Background notification
    if (cordova.plugins.backgroundMode) {
        cordova.plugins.backgroundMode.setDefaults({
            title: 'KLS Radio',
            text: 'Ready',
            silent: false
        });
    }

    // Media Session buttons
    if (window.MediaSession) {
        MediaSession.setActionHandler('play', () => resume());
        MediaSession.setActionHandler('pause', () => pause());
        MediaSession.setActionHandler('nexttrack', () => next());
        MediaSession.setActionHandler('previoustrack', () => previous());
    }
}

function play(index) {
    stop();

    const station = STATIONS[index];
    if (!station) return;

    currentIndex = index;

    media = new Media(
        station.url,
        () => console.log("Stream ended"),
        err => retry(err)
    );

    media.play();
    playing = true;

    cordova.plugins.backgroundMode.enable();
    updateNotification(station);
    updateMediaSession(station);
}

function resume() {
    if (media && !playing) {
        media.play();
        playing = true;
    }
}

function pause() {
    if (!media) return;
    media.pause();
    playing = false;
}

function stop() {
    if (media) {
        media.stop();
        media.release();
        media = null;
    }
    playing = false;
    cordova.plugins.backgroundMode.disable();
}

function next() {
    let nextIndex = (currentIndex + 1) % STATIONS.length;
    play(nextIndex);
}

function previous() {
    let prevIndex = (currentIndex - 1 + STATIONS.length) % STATIONS.length;
    play(prevIndex);
}

function retry(error) {
    console.log("Stream error:", error);
    if (!playing) return;

    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
        play(currentIndex);
    }, 3000);
}

function updateNotification(station) {
    cordova.plugins.backgroundMode.configure({
        title: station.name,
        text: station.description
    });
}

function updateMediaSession(station) {
    if (!window.MediaSession) return;

    MediaSession.setMetadata({
        title: station.name,
        artist: "Kingdom Lifestyle Radio",
        album: station.description,
        artwork: [
            { src: "www/images/icon.png", sizes: "512x512", type: "image/png" }
        ]
    });

    MediaSession.setPlaybackState(playing ? 'playing' : 'paused');
}

window.KLSRadio = {
    play,
    pause,
    stop,
    next,
    previous,
    stations: STATIONS
};
