/**
 * Background Audio Controller for KLS Radio
 * Handles background playback and lock screen controls
 */

class BackgroundAudio {
    constructor() {
        this.isPlaying = false;
        this.currentMedia = null;
        this.currentStation = null;
        this.isBackgroundMode = false;
        this.mediaSession = null;
        this.init();
    }

    init() {
        // Wait for Cordova to load
        document.addEventListener('deviceready', () => {
            console.log('Cordova ready, initializing background audio...');
            this.setupBackgroundMode();
            this.setupMusicControls();
            this.setupMediaSession();
        }, false);
    }

    setupBackgroundMode() {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
            console.log('Setting up background mode...');
            
            // Configure background mode
            cordova.plugins.backgroundMode.setDefaults({
                title: 'KLS Radio',
                text: 'Playing Gospel Music',
                color: '#0a0f2d',
                resume: true,
                hidden: false,
                bigText: true
            });

            // Enable background mode
            cordova.plugins.backgroundMode.enable();
            
            // When app goes to background
            cordova.plugins.backgroundMode.on('activate', () => {
                console.log('App entered background mode');
                this.isBackgroundMode = true;
                
                // Ensure audio keeps playing
                if (this.isPlaying && this.currentMedia) {
                    this.play();
                }
            });

            // When app returns to foreground
            cordova.plugins.backgroundMode.on('deactivate', () => {
                console.log('App returned to foreground');
                this.isBackgroundMode = false;
            });

            console.log('Background mode configured');
        } else {
            console.warn('Background mode plugin not available');
        }
    }

    setupMusicControls() {
        if (window.MusicControls) {
            console.log('Setting up music controls...');
            
            // Create notification channel for Android 8.0+
            if (window.device && window.device.platform === 'Android') {
                MusicControls.createNotificationChannel({
                    id: 'kls_radio_channel',
                    name: 'KLS Radio Playback',
                    description: 'Controls for KLS Radio playback',
                    importance: 'high',
                    visibility: 'public'
                });
            }
            
            // Setup music controls event listeners
            MusicControls.subscribe((action) => {
                console.log('Music control action:', action);
                
                switch(action) {
                    case 'play':
                        this.play();
                        break;
                    case 'pause':
                        this.pause();
                        break;
                    case 'next':
                        if (window.switchChannel) {
                            window.switchChannel(1);
                        }
                        break;
                    case 'previous':
                        if (window.switchChannel) {
                            window.switchChannel(-1);
                        }
                        break;
                    case 'close':
                        this.stop();
                        break;
                    case 'music-controls-next':
                        if (window.switchChannel) {
                            window.switchChannel(1);
                        }
                        break;
                    case 'music-controls-previous':
                        if (window.switchChannel) {
                            window.switchChannel(-1);
                        }
                        break;
                    case 'music-controls-pause':
                        this.pause();
                        break;
                    case 'music-controls-play':
                        this.play();
                        break;
                    case 'music-controls-destroy':
                        this.stop();
                        break;
                }
                
                // Update music controls
                this.updateMusicControls();
            });
            
            // Listen to errors
            MusicControls.listen((error) => {
                console.error('MusicControls error:', error);
            });
            
            console.log('Music controls configured');
        } else {
            console.warn('MusicControls plugin not available');
        }
    }

    setupMediaSession() {
        // Check if media session API is available
        if ('mediaSession' in navigator) {
            console.log('Setting up Media Session API...');
            
            // Set action handlers
            navigator.mediaSession.setActionHandler('play', () => {
                console.log('Media Session: Play requested');
                this.play();
            });
            
            navigator.mediaSession.setActionHandler('pause', () => {
                console.log('Media Session: Pause requested');
                this.pause();
            });
            
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                console.log('Media Session: Previous track requested');
                if (window.switchChannel) {
                    window.switchChannel(-1);
                }
            });
            
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                console.log('Media Session: Next track requested');
                if (window.switchChannel) {
                    window.switchChannel(1);
                }
            });
            
            navigator.mediaSession.setActionHandler('stop', () => {
                console.log('Media Session: Stop requested');
                this.stop();
            });
            
            console.log('Media Session API configured');
        } else {
            console.warn('Media Session API not available');
        }
    }

    playStation(station) {
        console.log('Playing station:', station);
        this.currentStation = station;
        
        // Stop any existing playback
        if (this.currentMedia) {
            this.stop();
        }
        
        // Create audio element for streaming
        const audio = new Audio(station.url);
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audio.volume = window.appState ? window.appState.settings.radioVolume : 1;
        
        // Set up event listeners
        audio.addEventListener('playing', () => {
            this.isPlaying = true;
            console.log('Audio playback started');
            this.updateMusicControls();
        });
        
        audio.addEventListener('pause', () => {
            if (!window.appState || !window.appState.radioShouldPlay) {
                this.isPlaying = false;
                console.log('Audio playback paused by user');
            }
            this.updateMusicControls();
        });
        
        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.handlePlaybackError();
        });
        
        audio.addEventListener('ended', () => {
            console.log('Audio stream ended, auto-restarting...');
            setTimeout(() => {
                this.playStation(station);
            }, 1000);
        });
        
        // Start playback
        audio.play().then(() => {
            this.isPlaying = true;
            this.currentMedia = audio;
            this.updateMusicControls();
            console.log('Station playback started');
        }).catch(error => {
            console.error('Playback error:', error);
            this.handlePlaybackError();
        });
    }

    play() {
        if (this.currentMedia && !this.isPlaying) {
            this.currentMedia.play().then(() => {
                this.isPlaying = true;
                this.updateMusicControls();
                console.log('Playback resumed');
            }).catch(error => {
                console.error('Resume error:', error);
            });
        } else if (this.currentStation && !this.currentMedia) {
            this.playStation(this.currentStation);
        }
    }

    pause() {
        if (this.currentMedia && this.isPlaying) {
            this.currentMedia.pause();
            this.isPlaying = false;
            this.updateMusicControls();
            console.log('Playback paused');
        }
    }

    stop() {
        if (this.currentMedia) {
            this.currentMedia.pause();
            this.currentMedia.currentTime = 0;
            this.isPlaying = false;
            this.updateMusicControls();
            console.log('Playback stopped');
            
            // Clear references
            this.currentMedia = null;
        }
    }

    updateMusicControls() {
        if (!this.currentStation) return;
        
        const station = this.currentStation;
        
        // Update Media Session API if available
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: station.name,
                artist: 'Kingdom Lifestyle Radio',
                album: '24/7 Gospel Streaming',
                artwork: [
                    {
                        src: 'https://kingdomlifestyleradio.com/logo.png',
                        sizes: '96x96',
                        type: 'image/png'
                    }
                ]
            });
            
            navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
        }
        
        // Update Music Controls plugin if available
        if (window.MusicControls) {
            MusicControls.updateIsPlaying(this.isPlaying);
            
            MusicControls.updateMetadata({
                artist: 'Kingdom Lifestyle Radio',
                title: station.name,
                album: '24/7 Gospel Streaming',
                genre: 'Gospel',
                duration: 0, // Live stream
                elapsed: 0,
                ticker: `Now Playing: ${station.name}`,
                artwork: 'https://kingdomlifestyleradio.com/logo.png',
                isPlaying: this.isPlaying,
                dismissable: false,
                hasPrev: true,
                hasNext: true,
                hasSkipForward: false,
                hasSkipBackward: false,
                skipForwardInterval: 0,
                skipBackwardInterval: 0,
                hasScrubbing: false,
                playIcon: 'media_play',
                pauseIcon: 'media_pause',
                prevIcon: 'media_previous',
                nextIcon: 'media_next',
                closeIcon: 'media_close'
            });
            
            console.log('Music controls updated');
        }
    }

    handlePlaybackError() {
        console.error('Playback error occurred');
        this.isPlaying = false;
        this.updateMusicControls();
        
        // Try to reconnect after 5 seconds
        setTimeout(() => {
            if (this.currentStation && !this.isPlaying) {
                console.log('Attempting to reconnect...');
                this.playStation(this.currentStation);
            }
        }, 5000);
    }

    // Clean up
    destroy() {
        this.stop();
        if (window.MusicControls) {
            MusicControls.destroy();
        }
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
            cordova.plugins.backgroundMode.disable();
        }
    }
}

// Export as global
window.BackgroundAudio = BackgroundAudio;
