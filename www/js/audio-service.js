// www/js/audio-service.js - Background Audio Service

class AudioService {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentStation = null;
        this.init();
    }

    init() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        document.addEventListener('pause', this.onAppPause.bind(this), false);
        document.addEventListener('resume', this.onAppResume.bind(this), false);
    }

    onDeviceReady() {
        console.log('AudioService: Device ready');
        
        // Initialize background mode
        if (window.cordova && cordova.plugins && cordova.plugins.backgroundMode) {
            cordova.plugins.backgroundMode.enable();
            cordova.plugins.backgroundMode.on('activate', this.onBackgroundActivate.bind(this));
            cordova.plugins.backgroundMode.on('deactivate', this.onBackgroundDeactivate.bind(this));
            
            cordova.plugins.backgroundMode.setDefaults({
                title: 'KLS Radio',
                text: 'Playing Kingdom Lifestyle Radio',
                icon: 'icon',
                color: '0a0f2d',
                resume: true,
                hidden: false,
                bigText: true
            });
        }

        // Initialize music controls
        this.initMusicControls();
    }

    initMusicControls() {
        if (typeof MusicControls === 'undefined') {
            console.warn('MusicControls plugin not available');
            return;
        }

        try {
            MusicControls.create({
                track: 'KLS Radio',
                artist: 'Kingdom Lifestyle Radio',
                cover: 'icon.png',
                isPlaying: true,
                dismissable: false,
                hasPrev: true,
                hasNext: true,
                hasClose: false,
                hasSkipForward: false,
                hasSkipBackward: false,
                ticker: 'Now playing: Kingdom Lifestyle Radio'
            });

            MusicControls.subscribe(this.onMusicControlsEvent.bind(this));
            MusicControls.listen();
        } catch (error) {
            console.error('MusicControls initialization failed:', error);
        }
    }

    onMusicControlsEvent(event) {
        console.log('MusicControls event:', event);
        
        switch(event.message) {
            case 'music-controls-next':
                this.nextStation();
                break;
            case 'music-controls-previous':
                this.previousStation();
                break;
            case 'music-controls-pause':
                this.pause();
                break;
            case 'music-controls-play':
                this.play();
                break;
            case 'music-controls-toggle-play-pause':
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
                break;
        }
    }

    onBackgroundActivate() {
        console.log('App is now in background');
        if (this.isPlaying) {
            this.updateNotification();
        }
    }

    onBackgroundDeactivate() {
        console.log('App is now in foreground');
    }

    onAppPause() {
        console.log('App paused');
        // Keep playing in background
    }

    onAppResume() {
        console.log('App resumed');
        if (this.isPlaying) {
            this.updateNotification();
        }
    }

    playStation(station) {
        this.currentStation = station;
        
        // Stop existing audio if any
        if (this.audio) {
            this.stop();
        }

        // Create new audio element
        this.audio = new Audio(station.url);
        this.audio.crossOrigin = 'anonymous';
        this.audio.preload = 'auto';
        this.audio.volume = 1.0;

        this.audio.onplaying = () => {
            this.isPlaying = true;
            this.updateNotification();
            this.onPlaybackStarted(station);
        };

        this.audio.onpause = () => {
            this.isPlaying = false;
            this.updateNotification();
        };

        this.audio.onerror = (error) => {
            console.error('Audio error:', error);
            this.onPlaybackError(station);
        };

        this.audio.onended = () => {
            console.log('Audio ended, restarting...');
            setTimeout(() => this.playStation(station), 1000);
        };

        // Start playback
        this.audio.play().catch(error => {
            console.error('Play failed:', error);
            // Try again with user gesture
            this.onPlaybackError(station);
        });
    }

    play() {
        if (this.currentStation && !this.isPlaying) {
            this.playStation(this.currentStation);
        }
    }

    pause() {
        if (this.audio && this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            this.updateNotification();
        }
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
            this.isPlaying = false;
            this.updateNotification();
        }
    }

    nextStation() {
        // Call your app's next station function
        if (window.switchRadioStation) {
            window.switchRadioStation('next');
        }
    }

    previousStation() {
        // Call your app's previous station function
        if (window.switchRadioStation) {
            window.switchRadioStation('prev');
        }
    }

    updateNotification() {
        if (typeof MusicControls !== 'undefined') {
            const station = this.currentStation || { name: 'KLS Radio', description: 'Kingdom Lifestyle Radio' };
            
            MusicControls.updateIsPlaying(this.isPlaying);
            MusicControls.update({
                track: station.name,
                artist: station.description,
                isPlaying: this.isPlaying
            });
        }

        // Update background mode notification
        if (cordova.plugins && cordova.plugins.backgroundMode) {
            const station = this.currentStation || { name: 'KLS Radio', description: 'Kingdom Lifestyle Radio' };
            
            if (this.isPlaying) {
                cordova.plugins.backgroundMode.configure({
                    text: `Playing: ${station.name}`,
                    title: 'KLS Radio'
                });
            }
        }
    }

    onPlaybackStarted(station) {
        // Update UI
        if (window.updateRadioDisplay) {
            window.updateRadioDisplay();
        }
        
        // Show notification
        this.showToast(`Now playing: ${station.name}`);
    }

    onPlaybackError(station) {
        console.error(`Failed to play: ${station.name}`);
        this.showToast(`Connection error with ${station.name}`, 'error');
    }

    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : '#0a0f2d'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
}

// Create global instance
window.audioService = new AudioService();
