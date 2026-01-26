// js/background-audio.js - Complete Background Audio Management

class BackgroundAudioManager {
    constructor() {
        this.isPlaying = false;
        this.currentStation = null;
        this.media = null;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 1.0;
        this.backgroundModeEnabled = false;
        this.musicControlsInitialized = false;
        
        // Initialize when device is ready
        document.addEventListener('deviceready', this.init.bind(this), false);
    }

    async init() {
        console.log('BackgroundAudioManager: Initializing...');
        
        try {
            // Initialize background mode
            await this.initBackgroundMode();
            
            // Request permissions for Android 13+
            await this.requestPermissions();
            
            // Initialize music controls for lock screen
            await this.initMusicControls();
            
            // Set up media session for Android 12+
            this.setupMediaSession();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('BackgroundAudioManager: Initialized successfully');
        } catch (error) {
            console.error('BackgroundAudioManager: Initialization failed', error);
        }
    }

    async initBackgroundMode() {
        return new Promise((resolve) => {
            if (typeof cordova === 'undefined' || !cordova.plugins || !cordova.plugins.backgroundMode) {
                console.warn('BackgroundMode plugin not available');
                resolve(false);
                return;
            }

            cordova.plugins.backgroundMode.enable();
            cordova.plugins.backgroundMode.on('activate', () => {
                console.log('BackgroundMode: App is now in background');
                this.backgroundModeEnabled = true;
                
                // Keep CPU awake
                cordova.plugins.backgroundMode.disableWebViewOptimizations();
                
                // Update notification
                this.updateNotification();
            });

            cordova.plugins.backgroundMode.on('deactivate', () => {
                console.log('BackgroundMode: App is now in foreground');
                this.backgroundModeEnabled = false;
            });

            // Configure background mode
            cordova.plugins.backgroundMode.setDefaults({
                title: 'KLS Radio',
                text: 'Playing: Kingdom Lifestyle Radio',
                icon: 'icon',
                color: '0a0f2d',
                resume: true,
                hidden: false,
                bigText: true,
                silent: false
            });

            this.backgroundModeEnabled = true;
            console.log('BackgroundMode: Enabled');
            resolve(true);
        });
    }

    async requestPermissions() {
        return new Promise((resolve) => {
            if (typeof cordova === 'undefined' || !cordova.plugins || !cordova.plugins.permissions) {
                console.warn('Permissions plugin not available');
                resolve(false);
                return;
            }

            const permissions = cordova.plugins.permissions;
            const permissionList = [
                permissions.POST_NOTIFICATIONS,
                permissions.FOREGROUND_SERVICE,
                permissions.WAKE_LOCK,
                'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'
            ];

            permissions.requestPermissions(permissionList, (status) => {
                if (status.hasPermission) {
                    console.log('Permissions: Granted');
                    resolve(true);
                } else {
                    console.warn('Permissions: Some permissions denied');
                    resolve(false);
                }
            }, null);
        });
    }

    async initMusicControls() {
        return new Promise((resolve) => {
            if (typeof MusicControls === 'undefined') {
                console.warn('MusicControls plugin not available');
                resolve(false);
                return;
            }

            try {
                // Create initial music controls
                MusicControls.create({
                    track: 'Kingdom Lifestyle Radio',
                    artist: '24/7 Gospel Streaming',
                    cover: 'images/icon.png',
                    isPlaying: false,
                    dismissable: false,
                    hasPrev: true,
                    hasNext: true,
                    hasClose: false,
                    hasSkipForward: false,
                    hasSkipBackward: false,
                    hasScrubbing: false,
                    ticker: 'Now playing: Kingdom Lifestyle Radio',
                    playIcon: 'play_arrow',
                    pauseIcon: 'pause',
                    prevIcon: 'skip_previous',
                    nextIcon: 'skip_next',
                    closeIcon: 'close',
                    notificationIcon: 'notification_icon'
                }, () => {
                    console.log('MusicControls: Created successfully');
                    this.musicControlsInitialized = true;
                    
                    // Subscribe to events
                    MusicControls.subscribe((event) => {
                        this.handleMusicControlsEvent(event);
                    });
                    
                    MusicControls.listen();
                    resolve(true);
                }, (error) => {
                    console.error('MusicControls: Creation failed', error);
                    resolve(false);
                });
            } catch (error) {
                console.error('MusicControls: Initialization error', error);
                resolve(false);
            }
        });
    }

    setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => {
                this.play();
            });
            
            navigator.mediaSession.setActionHandler('pause', () => {
                this.pause();
            });
            
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                this.previous();
            });
            
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                this.next();
            });
            
            navigator.mediaSession.setActionHandler('seekbackward', () => {
                // Handle seek backward
            });
            
            navigator.mediaSession.setActionHandler('seekforward', () => {
                // Handle seek forward
            });
            
            console.log('MediaSession: Configured');
        }
    }

    setupEventListeners() {
        // Handle app pause/resume
        document.addEventListener('pause', () => {
            console.log('App: Paused');
            if (this.isPlaying && this.backgroundModeEnabled) {
                this.updateNotification();
            }
        }, false);

        document.addEventListener('resume', () => {
            console.log('App: Resumed');
            if (this.backgroundModeEnabled) {
                this.updateNotification();
            }
        }, false);

        // Handle device going to sleep
        document.addEventListener('deviceready', () => {
            if (cordova.plugins && cordova.plugins.powerManagement) {
                cordova.plugins.powerManagement.acquire();
                console.log('PowerManagement: Wake lock acquired');
            }
        }, false);
    }

    handleMusicControlsEvent(event) {
        console.log('MusicControls: Event received', event);
        
        switch (event.message) {
            case 'music-controls-next':
                this.next();
                break;
                
            case 'music-controls-previous':
                this.previous();
                break;
                
            case 'music-controls-pause':
                this.pause();
                break;
                
            case 'music-controls-play':
                this.play();
                break;
                
            case 'music-controls-destroy':
                // Handle destroy if needed
                break;
                
            case 'music-controls-toggle-play-pause':
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
                break;
                
            case 'music-controls-seek-to':
                if (event.position !== undefined) {
                    this.seek(event.position);
                }
                break;
                
            case 'music-controls-skip-forward':
                // Handle skip forward
                break;
                
            case 'music-controls-skip-backward':
                // Handle skip backward
                break;
        }
    }

    playStation(station) {
        if (!station || !station.url) {
            console.error('BackgroundAudioManager: Invalid station');
            return;
        }

        this.currentStation = station;
        
        // Stop current playback if any
        if (this.media) {
            this.stop();
        }

        // Create new media instance
        this.media = new Media(station.url, 
            () => {
                console.log('Media: Playback started');
                this.isPlaying = true;
                this.updateNotification();
                this.updatePlaybackState();
            },
            (error) => {
                console.error('Media: Playback error', error);
                this.isPlaying = false;
                this.updateNotification();
                
                // Try to reconnect after error
                setTimeout(() => {
                    if (this.currentStation) {
                        this.playStation(this.currentStation);
                    }
                }, 3000);
            },
            (status) => {
                if (status === Media.MEDIA_STOPPED) {
                    console.log('Media: Playback stopped');
                    this.isPlaying = false;
                }
            }
        );

        // Set volume
        this.media.setVolume(this.volume.toString());
        
        // Start playback
        this.media.play();
        
        // Enable background mode if available
        if (this.backgroundModeEnabled && cordova.plugins.backgroundMode) {
            cordova.plugins.backgroundMode.enable();
        }
    }

    play() {
        if (this.media && !this.isPlaying) {
            this.media.play();
            this.isPlaying = true;
            this.updateNotification();
            this.updatePlaybackState();
        } else if (this.currentStation && !this.media) {
            this.playStation(this.currentStation);
        }
    }

    pause() {
        if (this.media && this.isPlaying) {
            this.media.pause();
            this.isPlaying = false;
            this.updateNotification();
            this.updatePlaybackState();
        }
    }

    stop() {
        if (this.media) {
            this.media.stop();
            this.media.release();
            this.media = null;
            this.isPlaying = false;
            this.updateNotification();
            this.updatePlaybackState();
        }
    }

    next() {
        // Implement next station logic
        if (window.appState && window.appState.stations) {
            const currentIndex = window.appState.currentStation || 0;
            const nextIndex = (currentIndex + 1) % window.appState.stations.length;
            const nextStation = window.appState.stations[nextIndex];
            
            if (nextStation) {
                window.appState.currentStation = nextIndex;
                this.playStation(nextStation);
                
                // Update UI if available
                if (window.updateRadioDisplay) {
                    window.updateRadioDisplay();
                }
            }
        }
    }

    previous() {
        // Implement previous station logic
        if (window.appState && window.appState.stations) {
            const currentIndex = window.appState.currentStation || 0;
            const prevIndex = (currentIndex - 1 + window.appState.stations.length) % window.appState.stations.length;
            const prevStation = window.appState.stations[prevIndex];
            
            if (prevStation) {
                window.appState.currentStation = prevIndex;
                this.playStation(prevStation);
                
                // Update UI if available
                if (window.updateRadioDisplay) {
                    window.updateRadioDisplay();
                }
            }
        }
    }

    seek(position) {
        if (this.media && position >= 0) {
            this.media.seekTo(position * 1000); // Convert to milliseconds
        }
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        if (this.media) {
            this.media.setVolume(this.volume.toString());
        }
    }

    updateNotification() {
        if (!this.musicControlsInitialized || typeof MusicControls === 'undefined') {
            return;
        }

        try {
            const station = this.currentStation || { name: 'Kingdom Lifestyle Radio', description: '24/7 Gospel Streaming' };
            
            MusicControls.updateIsPlaying(this.isPlaying);
            MusicControls.update({
                track: station.name,
                artist: station.description,
                cover: 'images/icon.png',
                isPlaying: this.isPlaying,
                dismissable: false,
                hasPrev: true,
                hasNext: true,
                ticker: `Now playing: ${station.name}`
            });
        } catch (error) {
            console.error('MusicControls: Update failed', error);
        }
    }

    updatePlaybackState() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
            
            if (this.currentStation) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: this.currentStation.name,
                    artist: this.currentStation.description,
                    artwork: [
                        { src: 'images/icon.png', sizes: '96x96', type: 'image/png' },
                        { src: 'images/icon.png', sizes: '128x128', type: 'image/png' },
                        { src: 'images/icon.png', sizes: '192x192', type: 'image/png' },
                        { src: 'images/icon.png', sizes: '256x256', type: 'image/png' },
                        { src: 'images/icon.png', sizes: '384x384', type: 'image/png' },
                        { src: 'images/icon.png', sizes: '512x512', type: 'image/png' }
                    ]
                });
            }
        }
    }

    // Public API
    getCurrentStation() {
        return this.currentStation;
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    getVolume() {
        return this.volume;
    }
}

// Create global instance
window.BackgroundAudioManager = new BackgroundAudioManager();
