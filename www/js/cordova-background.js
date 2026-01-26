// www/js/cordova-background.js - Simple Cordova Background Audio

class CordovaBackgroundAudio {
    constructor() {
        this.isPlaying = false;
        this.currentStation = null;
        this.audio = null;
        this.init();
    }

    init() {
        // Wait for device ready
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        
        // Handle app lifecycle
        document.addEventListener('pause', this.onAppPause.bind(this), false);
        document.addEventListener('resume', this.onAppResume.bind(this), false);
    }

    onDeviceReady() {
        console.log('CordovaBackgroundAudio: Device ready');
        
        // Initialize background mode if plugin exists
        if (window.cordova && cordova.plugins && cordova.plugins.backgroundMode) {
            this.initBackgroundMode();
        }
        
        // Initialize music controls if plugin exists
        if (typeof MusicControls !== 'undefined') {
            this.initMusicControls();
        }
    }

    initBackgroundMode() {
        try {
            cordova.plugins.backgroundMode.enable();
            
            cordova.plugins.backgroundMode.on('activate', () => {
                console.log('Background mode activated');
                if (this.isPlaying) {
                    this.updateNotification();
                }
            });
            
            cordova.plugins.backgroundMode.on('deactivate', () => {
                console.log('Background mode deactivated');
            });
            
            // Set default notification
            cordova.plugins.backgroundMode.setDefaults({
                title: 'KLS Radio',
                text: 'Playing gospel music',
                icon: 'ic_notification',
                color: '0a0f2d',
                hidden: false,
                bigText: true
            });
            
            console.log('Background mode initialized');
        } catch (error) {
            console.error('Background mode initialization failed:', error);
        }
    }

    initMusicControls() {
        try {
            MusicControls.create({
                track: 'KLS Radio',
                artist: 'Kingdom Lifestyle Radio',
                cover: 'icon',
                isPlaying: false,
                dismissable: false,
                hasPrev: true,
                hasNext: true,
                hasClose: false,
                ticker: 'Now playing: KLS Radio'
            });
            
            MusicControls.subscribe((event) => {
                this.onMusicControlsEvent(event);
            });
            
            MusicControls.listen();
            console.log('Music controls initialized');
        } catch (error) {
            console.error('Music controls initialization failed:', error);
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

    onAppPause() {
        console.log('App paused');
        // Keep playing in background
        if (this.isPlaying && cordova.plugins && cordova.plugins.backgroundMode) {
            cordova.plugins.backgroundMode.enable();
        }
    }

    onAppResume() {
        console.log('App resumed');
        if (this.isPlaying) {
            this.updateNotification();
        }
    }

    playStation(station) {
        if (!station || !station.url) {
            console.error('Invalid station');
            return;
        }
        
        this.currentStation = station;
        
        // Stop existing audio
        this.stop();
        
        // Create audio element
        this.audio = new Audio();
        this.audio.src = station.url;
        this.audio.crossOrigin = 'anonymous';
        this.audio.preload = 'auto';
        this.audio.volume = 1.0;
        
        // Set up event listeners
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
            this.isPlaying = false;
            this.onPlaybackError(station);
        };
        
        // Start playback
        this.audio.play()
            .then(() => {
                console.log('Playback started');
                // Enable background mode if available
                if (cordova.plugins && cordova.plugins.backgroundMode) {
                    cordova.plugins.backgroundMode.enable();
                }
            })
            .catch(error => {
                console.error('Play failed:', error);
                this.onPlaybackError(station);
            });
    }

    play() {
        if (this.currentStation && !this.isPlaying) {
            this.playStation(this.currentStation);
        } else if (!this.currentStation && window.appState && window.appState.stations) {
            // Play first station
            const station = window.appState.stations[0];
            this.playStation(station);
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
        if (window.appState && window.appState.stations) {
            const currentIndex = window.appState.currentStation || 0;
            const nextIndex = (currentIndex + 1) % window.appState.stations.length;
            const station = window.appState.stations[nextIndex];
            
            if (station) {
                window.appState.currentStation = nextIndex;
                this.playStation(station);
                
                // Update UI
                if (window.updateRadioDisplay) {
                    window.updateRadioDisplay();
                }
            }
        }
    }

    previousStation() {
        if (window.appState && window.appState.stations) {
            const currentIndex = window.appState.currentStation || 0;
            const prevIndex = (currentIndex - 1 + window.appState.stations.length) % window.appState.stations.length;
            const station = window.appState.stations[prevIndex];
            
            if (station) {
                window.appState.currentStation = prevIndex;
                this.playStation(station);
                
                // Update UI
                if (window.updateRadioDisplay) {
                    window.updateRadioDisplay();
                }
            }
        }
    }

    updateNotification() {
        // Update music controls
        if (typeof MusicControls !== 'undefined') {
            const station = this.currentStation || { name: 'KLS Radio', description: 'Kingdom Lifestyle Radio' };
            
            try {
                MusicControls.updateIsPlaying(this.isPlaying);
                MusicControls.update({
                    track: station.name,
                    artist: station.description,
                    isPlaying: this.isPlaying
                });
            } catch (error) {
                console.error('Music controls update failed:', error);
            }
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
        console.log(`Playback started: ${station.name}`);
        
        // Update UI
        if (window.updateRadioDisplay) {
            window.updateRadioDisplay();
        }
        
        // Show toast
        this.showToast(`Now playing: ${station.name}`);
    }

    onPlaybackError(station) {
        console.error(`Playback error for: ${station.name}`);
        this.showToast(`Connection error: ${station.name}`, 'error');
        
        // Try to reconnect after 3 seconds
        if (this.currentStation === station) {
            setTimeout(() => {
                if (this.currentStation === station) {
                    this.playStation(station);
                }
            }, 3000);
        }
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
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Create global instance
window.cordovaAudio = new CordovaBackgroundAudio();

// Add CSS for animations if not already present
if (!document.querySelector('#toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
