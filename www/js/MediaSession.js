/**
 * Media Session API for web browser support
 */

class MediaSessionController {
    constructor() {
        this.currentMetadata = null;
        this.playbackState = 'none';
        this.init();
    }

    init() {
        if ('mediaSession' in navigator) {
            console.log('Media Session API available');
            this.setupMediaSession();
        } else {
            console.warn('Media Session API not available');
        }
    }

    setupMediaSession() {
        // Set default action handlers
        navigator.mediaSession.setActionHandler('play', () => {
            console.log('Media Session: Play requested');
            this.onPlay && this.onPlay();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            console.log('Media Session: Pause requested');
            this.onPause && this.onPause();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            console.log('Media Session: Previous track requested');
            this.onPrevious && this.onPrevious();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            console.log('Media Session: Next track requested');
            this.onNext && this.onNext();
        });

        navigator.mediaSession.setActionHandler('stop', () => {
            console.log('Media Session: Stop requested');
            this.onStop && this.onStop();
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            console.log('Media Session: Seek backward', details);
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            console.log('Media Session: Seek forward', details);
        });

        navigator.mediaSession.setActionHandler('seekto', (details) => {
            console.log('Media Session: Seek to', details);
        });
    }

    setMetadata(metadata) {
        if (!('mediaSession' in navigator)) return;
        
        this.currentMetadata = metadata;
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: metadata.title || 'KLS Radio',
            artist: metadata.artist || 'Kingdom Lifestyle Radio',
            album: metadata.album || '24/7 Gospel Streaming',
            artwork: metadata.artwork || [
                { src: 'https://kingdomlifestyleradio.com/logo.png', sizes: '96x96', type: 'image/png' },
                { src: 'https://kingdomlifestyleradio.com/logo.png', sizes: '128x128', type: 'image/png' },
                { src: 'https://kingdomlifestyleradio.com/logo.png', sizes: '192x192', type: 'image/png' },
                { src: 'https://kingdomlifestyleradio.com/logo.png', sizes: '256x256', type: 'image/png' },
                { src: 'https://kingdomlifestyleradio.com/logo.png', sizes: '384x384', type: 'image/png' },
                { src: 'https://kingdomlifestyleradio.com/logo.png', sizes: '512x512', type: 'image/png' }
            ]
        });
    }

    setPlaybackState(state) {
        if (!('mediaSession' in navigator)) return;
        
        this.playbackState = state;
        navigator.mediaSession.playbackState = state;
    }

    // Event callbacks
    setOnPlay(callback) {
        this.onPlay = callback;
    }

    setOnPause(callback) {
        this.onPause = callback;
    }

    setOnStop(callback) {
        this.onStop = callback;
    }

    setOnPrevious(callback) {
        this.onPrevious = callback;
    }

    setOnNext(callback) {
        this.onNext = callback;
    }
}

// Export as global
window.MediaSessionController = MediaSessionController;
